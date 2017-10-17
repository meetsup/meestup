let loadingId = 0;
let successId = 0;
const LIMIT_TIME = 1000;

const showLoading = () => {
  loadingId += 1;

  wx.showToast({
    title: '加载中…',
    icon: 'loading',
    duration: 10000
  })
};

const showError = () => {
  wx.showToast({
    title: '网络异常',
    icon: 'loading',
    duration: 2000
  })
};

const hideLoading = (noStatus) => {
  if (!noStatus) {
    successId += 1;

    setTimeout(() => {
      if (successId >= loadingId) {
        wx.hideToast();
      }
    }, 100)
  }
};

const myfetch = (opts) => {
  const { url, data, method, complete, header, noStatus } = opts;
  if (!noStatus) {
    showLoading();
  }

  //获取当前页面栈
  const currentPages = getCurrentPages()
  const getCurrentPage = (needOpts) => {
    if (currentPages.length) {
      const currentPage = currentPages[currentPages.length - 1]
      const pagePath = currentPage.__route__
      let pageOptions = '';
      if (needOpts) {
        const arr = [];
        Object.keys(currentPage.options).forEach((prop) => {
          arr.push({
            key: prop,
            value: currentPage.options[prop]
          })
        })
        arr.forEach((item, index) => {
          if (index === arr.length - 1) {
            pageOptions += (`${item.key}=${item.value}`);
          } else {
            pageOptions += (`${item.key}=${item.value}&`);
          }
        })
      }
      return `/${pagePath}?${pageOptions}`
    }
    return ''
  }

  const userInfo = '';
  return new Promise((resolve, reject) => {
    const startTime = +new Date();
    wx.request({
      url,
      data,
      method: method || 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      header: Object.assign({
        Authorization: `Bearer ${userInfo ? userInfo.UserSession : ''}`,
        currentPage: getCurrentPage()
      }, header), // 设置请求的 header
      success(res) {
        // success
        const code = res.data.Code - 0;

        if (code === 0 && res.data.Message === '请重新登录' && url.indexOf(wx.apis.login) < 0) {
          return wx.redirectTo({
            url: '../login/login?page=home'
          });
        }

        //登录过期，重新登录
        /*if (res.statusCode - 0 === 401) {
          return wx.tuhu.gotoPageWithUser({
            url: getCurrentPage(true)
          });
        }*/
        if (res.statusCode - 0 !== 200) {
          showError(1, res);
          reject();
        } else {
          if (typeof res.data === 'string') {
            try {
              res.data = JSON.parse(res.data);
            } catch (e) {

            }
          }
          resolve(res);
        }
        /*else if (res.data.Code === undefined || code) {
        if (typeof res.data === 'string') {
          res.data = JSON.parse(res.data);
        }
        resolve(res);
        } else {
          showError(2, res);
          reject();
        }*/

        hideLoading(noStatus);
      },
      fail: (e) => {
        hideLoading(noStatus);

        showError(3, e);
        reject(new Error('request fail'));

        /*if (url.indexOf('/collect/') < 0) {
          wx.Ta({
            event_category: 'performance_monitor',
            event_action: 'WXAPP_ErrorAPI',
            event_type: 'event',
            metadata: JSON.stringify({
              error: JSON.stringify(e),
              url,
              params: data
            })
          });
        }*/
      },
      complete: () => {
        const useTimes = +new Date() - startTime;
        if (useTimes >= LIMIT_TIME && url.indexOf('/collect/') < 0) {
          /*wx.Ta({
            event_category: 'performance_monitor',
            event_action: 'WXAPP_SlowAPI',
            event_type: 'event',
            metadata: JSON.stringify({
              ms: useTimes,
              url,
              params: data
            })
          });*/
        }
        complete && complete();
      }
    })
  })
}

wx.fetch = myfetch
