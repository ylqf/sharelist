const service = require('./../models/index')
const base = require('../utils/base')
const request = require('request')
const config =require('../config')
const cache = {}

module.exports = {

  async index(ctx){
    let data = await service.path(ctx.paths , ctx.query , ctx.paths_raw)
    let base_url = ctx.path == '/' ? '' : ctx.path
    let parent = ctx.paths.length ? ('/' + ctx.paths.slice(0,-1).join('/')) : ''
    //data is readonly
    if( data === false){
      ctx.status = 404
    }
    else if(data.type == 'folder'){
      let resp = data.children.map((i)=>{
        let href = i.href || base.path(base_url+'/'+ (i.pathname|| i.name ))
        if(['audio','video','image'].indexOf(i.type) >= 0){
          href += (href.indexOf('?')>=0 ? '&' : '?') + 'preview'
        }
        return{
          href , type: i.type, name: i.name
        }
      })

      await ctx.render('index',{
        data:resp , base_url , parent
      })
    }else{
      let preview = ctx.request.querystring.indexOf('preview') >= 0
      let download_url = data.url


      if(preview){
        if(config.data.enabled_proxy){
          download_url = ctx.origin + ctx.path
        }
        await ctx.render('detail',{
          data , download_url
        })
      }
      else{
        if(config.data.enabled_proxy){
          console.log('proxy:',download_url)
          ctx.body = ctx.req.pipe(request(download_url))
        }else{
          ctx.redirect( download_url )
        }
      }
      
    }
    
  },
  async api(ctx){
    let token = ctx.params.token
    if(token == config.data.token){
      let data = await service.path(ctx.paths.slice(1))
      let base_url = ctx.url == '/' ? '' : ctx.url
      let parent = ctx.paths.length ? ('/' + ctx.paths.slice(0,-1).join('/')) : ''
      ctx.body = data
    }else{
      ctx.body = []
    }
    
  }
}