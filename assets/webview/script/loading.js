export default function($) {
  let loading = 0

  const icon = $.Icon('refresh')
  icon.style.animation = 'spin linear infinite .6s'
  icon.style.fontSize = '1.58rem'

  const el = $.Div('ppz-loading', [icon])
  el.style.position = 'fixed'
  el.style.right = '1rem'
  el.style.top = '1rem'

  el.style.transition = '.18s ease all'
  el.style.opacity = 0
  el.style.transform = 'scale(.8, .8)'

  $('body').appendChild(el)

  return {
    show() {
      loading ++
      console.debug('show', { loading })
      if(loading == 1) {
        el.style.opacity = .8
        el.style.transform = 'scale(1, 1)'
      }
    },
    hide() {
      setTimeout(() => {
        loading --
        console.debug('hide', { loading })
        if(loading == 0) {
          el.style.opacity = 0
          el.style.transform = 'scale(.8, .8)'
        }
      }, 300)
    }
  }
}