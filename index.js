'use strict';

function customToLocaleString (date) {
  const datetmp = date.getFullYear() +
  '-' +
      ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) +
  '-' +
      (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate())
  const time = (date.getHours() >= 10 ? date.getHours() : '0' + date.getHours()) +
  ':' +
      (date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()) +
  ':' +
      (date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds())
  let ms = date.getMilliseconds()
  ms = ms < 10 ? '00' + ms
      : ms < 100 ? '0' + ms
      : ms
  const datetime = datetmp + ' ' + time
  const datetimems = datetime + ' ' + ms
  return {
      date: datetmp,//日期， eg 2018-10-11
      time,//时间, eg 10:12:22
      datetime, //日期时间 eg 2018-10-11 10:12:22
      datetimems, // 日期时间 到毫秒级  eg 2018-10-11 10:12:22 320
  }
}
class Fulllog {
  constructor (props = {}) {
      this.collector = []
      this.ctx = props.ctx
      this.customReport = props.customReport
  }
  log (...params) {
      let {datetimems} = customToLocaleString(new Date())
      this.collector.push([`[${datetimems}]`,'[log]', ...params].join(','))
  }
  info (...params) {
      let {datetimems} = customToLocaleString(new Date())
      this.collector.push([`[${datetimems}]`,'[info]', ...params].join(','))
  }
  error (...params) {
      let {datetimems} = customToLocaleString(new Date())
      this.collector.push([`[${datetimems}]`,'[error]', ...params].join(','))
  }
  report () {
      if (this.customReport && typeof this.customReport === 'function') {
          this.customReport(this)//把fulllog实例传过去
          return
      } 
  }
}

module.exports = function(options = {}) {
  const defaults = {
    LEVEL: 10,
    onlyself: false
  };

  options = Object.assign({}, defaults, options);
  let {onlyself = false} = options
  return async function (ctx, next) {
    ctx.fulllog = new Fulllog({
        ctx,
        ...options
    })
    
    if (!onlyself) {
        ctx.fulllog.log('req start')
        let {version, platform, pid} = process
        let {rss, heapTotal, heapUsed, external} = process.memoryUsage() 
        ctx.fulllog.log('process info:', `[node版本: ${version}][平台: ${platform}][进程ID: ${pid}][运行时长: ${process.uptime()}][groupid: ${process.getgid()}][userid: ${process.getuid()}]`)
        ctx.fulllog.log('process info:', `[rss: ${rss}][heapTotal: ${heapTotal}][heapUsed: ${heapUsed}][external: ${external}]`)
        ctx.fulllog.log('req info:', JSON.stringify(ctx.request))
    }
    await next()
    if (!onlyself) {
        ctx.fulllog.log('res info:', JSON.stringify(ctx.response))
    }
    ctx.fulllog.report()
  };
};
