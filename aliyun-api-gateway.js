/* eslint-disable */
'use strict'

var cryptoJS = require('./crypto-js.js')
console.log(cryptoJS, 1111111)
if (cryptoJS.CryptoJS) {
  cryptoJS = cryptoJS.CryptoJS
}
var serviceUrl, appKey, appSecret, stage
let config = {}
/**
 * 获取UUID
 */
function uuid () {
  const s = []
  const hexDigits = '0123456789QWWRETYUIOPASDFGHJKLZXCVBNMzxcvbnmlkjhgfdsaqwertyuiop'
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '6'
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)
  return s.join('')
}

/**
 * 获取时间戳
 */
function getTimestamp () {
  return new Date().getTime()
}
/**
 * 计算签名值
 * @param {object} config
 * @param {object} signHeaderKeys
 */
function buildStringToSignature (config, signHeaderKeys) {
  console.log(config, 'config')
  const symbolN = '\n'
  // 请求方法
  const method = config.method.toUpperCase()
  const signatureStr = [method, symbolN]
  // Accept
  const accept = config.headers['Accept']
  if (accept) {
    signatureStr.push(accept)
  }
  signatureStr.push(symbolN)
  // Content-MD5
  const contentMd5 = config.headers['Content-MD5']
  if (contentMd5) {
    signatureStr.push(contentMd5)
  }
  signatureStr.push(symbolN)
  // Content-Type
  const contentType = config.headers['Content-Type']
  if (contentType) {
    signatureStr.push(contentType)
  }
  signatureStr.push(symbolN)
  // Content-Type
  const date = config.headers.date
  if (date) {
    signatureStr.push(date)
  }
  signatureStr.push(symbolN)
  // Headers
  // 获取需要参与签名的Headers字符串
  const signedHeadersStr = getSignatureHeadersStr(config.headers, signHeaderKeys)
  if (signedHeadersStr) {
    signatureStr.push(signedHeadersStr)
  }
  signatureStr.push(symbolN)
  config.params = getRequestJudge(config.params)
  // Path And Parameters
  console.log(config.isForm, 'ceshi')
  if (config.isForm) {
    console.log(IsExis(config.params), 9898)
    if (JSON.stringify(config.params) !== '{}') {
      const pathParameters = getPathAndParameters(config.url, config.params)
      signatureStr.push(pathParameters)
    } else {
      signatureStr.push(config.url + '?' + config.data)
    }
  } else {
    signatureStr.push(config.url)
  }
  const stringToSign = signatureStr.join('')
  return cryptoJS.enc.Base64.stringify(cryptoJS.HmacSHA256(stringToSign, appSecret))
}

/**
 * 获取需要参与签名的HeadersKey
 * @param {object} headers
 */
function getSignatureHeadersKey (headers) {
  const signatureKeys = []
  const reg = new RegExp('^x-ca-.*$')
  Object.keys(headers).forEach(key => {
    if (reg.test(key.toLowerCase())) {
      signatureKeys.push(key)
    }
  })
  // 按字典序排序
  return signatureKeys.sort()
}

/**
 * 获取需要参与签名的Headers字符串
 * @param {object} headers
 * @param {array} signatureHeadersKeys
 */
function getSignatureHeadersStr (headers, signatureHeadersKeys) {
  const headerList = []
  for (let i = 0; i < signatureHeadersKeys.length; i++) {
    const key = signatureHeadersKeys[i]
    headerList.push(key + ':' + headers[key])
  }
  return headerList.join('\n')
}

/**
 * 获取路径参数字符串
 * @param {string}} path
 * @param {object} params
 */
function getPathAndParameters (path, params) {
  return path + '?' + queryPamramsStringify(params)
}

/**
 * 获取conetntMD5值
 * @param {object}} data
 */
function getContentMD5 (data) {
  return cryptoJS.enc.Base64.stringify(cryptoJS.MD5(JSON.stringify(data)))
}

/**
 * Url地址栏参数拼接
 */
function queryPamramsStringify (params) {
  const paramList = []
  const paramKeys = Object.keys(params).sort()
  for (let i = 0; i < paramKeys.length; i++) {
    const key = paramKeys[i]
    paramList.push(key + '=' + encodeURI(params[key]))
  }
  return paramList.join('&')
}
// 判断数据是否为空
function IsExis (value) {
  if (
    value !== undefined &&
    value !== 'undefined' &&
    value !== null &&
    value !== 'null' &&
    value !== ''
  ) {
    return true
  } else {
    return false
  }
}
function GetlocalStorage (value) {
  if (IsExis(localStorage.getItem(value))) {
    return JSON.parse(unescape(localStorage.getItem(value)))
  }
  return null
}
/**
 * 去除非空的参数
 */
function getRequestJudge (query) {
  var obj = {}
  for (let i in query) {
    if (IsExis(query[i])) {
      obj[i] = query[i]
    }
  }
  return obj
}
// h5请求接口
function request (data, path, method, isForm, params, encry) {
  serviceUrl = data.serviceUrl
  appKey = data.appKey
  appSecret = data.appSecret
  stage = data.stage
  params = getRequestJudge(params)
  const instance = axios.create({
    baseURL: serviceUrl,
    timeout: 3000
  })
  console.log(data, path, method, isForm, params, encry)
  // 请求拦截器
  instance.interceptors.request.use(
    config => {
      console.log(config, 2222)
      if (!isForm) {
        config.isForm = false
      } else {
        config.isForm = true
      }
      // 每次发送请求之前将缓存中的Token设置到Header中
      // config.headers.token = getToken()
      config.headers['x-ca-key'] = appKey
      config.headers['x-ca-nonce'] = uuid()
      config.headers['x-ca-stage'] = stage
      config.headers['x-ca-timestamp'] = getTimestamp()
      config.headers['Accept'] = 'application/json'
      config.headers['token'] = IsExis(localStorage.getItem('u')) ? GetlocalStorage('u').token : ''
      // 获取需要参与签名的HeadersKey列表
      if (encry) {
        const md5Value = getContentMD5(params)
        config.headers['Content-MD5'] = md5Value
        config.headers['Content-Type'] = 'application/json;charset=UTF-8'
      }
      if ((method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') && isForm) {
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
      }
      const signHeaderKeys = getSignatureHeadersKey(config.headers)
      config.headers['x-ca-signature-headers'] = signHeaderKeys.join(',')
      config.headers['x-ca-signature'] = buildStringToSignature(config, signHeaderKeys)
      return config
    },
    error => {
      console.log(error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    response => {
      console.log(response, 57)
      if (response.status === 200) {
        console.log(response.data, 666666666666)
        return Promise.resolve(response.data)
      } else {
        return Promise.reject(response)
      }
    }
  )
  return new Promise(resolve => {
    var type = method.toLowerCase()
    var param = null
    switch (type) {
      case 'get':
        param = {
          params: params
        }
        break
      case 'post':
      case 'put':
        if (isForm) {
          param = queryPamramsStringify(params)
        } else {
          param = params
        }
        break
    }
    instance[type](path, param).then((res) => {
      resolve(res)
    })
  })
}
// 微信小程序请求接口
function wxrequest (data, path, method, isForm, params, encry) {
  serviceUrl = data.serviceUrl
  appKey = data.appKey
  appSecret = data.appSecret
  stage = data.stage
  let request = IsExis(uni) ? uni : wx
  config = {
    headers: {
      'x-ca-key': appKey,
      'x-ca-nonce': uuid(),
      'x-ca-stage': stage,
      'x-ca-timestamp': getTimestamp(),
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'token': IsExis(request.getStorageSync('token')) ? request.getStorageSync('token') : ''
    },
    method: method,
    url: path,
    params: params,
    isForm: isForm
  }
  if (encry) {
    const md5Value = getContentMD5(params)
    config.headers['Content-MD5'] = md5Value
  }
  if ((method.toUpperCase() === 'POST' || 'PUT') && isForm) {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
  }
  const signHeaderKeys = getSignatureHeadersKey(config.headers)
  config.headers['x-ca-signature-headers'] = signHeaderKeys.join(',')
  config.headers['x-ca-signature'] = buildStringToSignature(config, signHeaderKeys)
  return new Promise(function (resolve, reject) {
    request.request({
      url: serviceUrl + path,
      method: method,
      data: getRequestJudge(params),
      dataType: 'JSON',
      header: config.headers,
      success (res) {
        resolve(JSON.parse(res.data))
      },
      fail (err) {
        // 请求失败
        reject(err)
      }
    })
  })
}
export default {
  /**
  * @param {object} data
  * @param {string} path
  * @param {string} method
  * @param {Boolean} isForm
  * @param {object} param
  * @param {Boolean} encry
  */
  httpRequest (data, path, method, isForm, params, encry) {
    if (IsExis(window)) {
      return request(data, path, method, isForm, params, encry)
    } else {
      return wxrequest(data, path, method, isForm, params, encry)
    }
  }
}
