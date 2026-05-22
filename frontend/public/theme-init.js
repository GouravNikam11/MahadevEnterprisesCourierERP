;(function () {
  var key = 'mecs-erp-theme'
  try {
    var stored = localStorage.getItem(key)
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    var resolved =
      stored === 'dark' ? 'dark' : stored === 'light' ? 'light' : stored === 'system' ? (systemDark ? 'dark' : 'light') : 'light'
    var root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.style.colorScheme = resolved
  } catch (e) {
    /* ignore */
  }
})()
