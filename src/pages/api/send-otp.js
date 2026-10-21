const style = {
  padding: '10px 30px',
  fontSize: '11.5px',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#1A1A1A',
  borderRadius: '4px',
  border: '1px solid #8E8E8E',
  background: hover
    ? 'linear-gradient(180deg, #F2F2F2 0%, #D6D6D6 45%, #B8B8B8 55%, #A0A0A0 100%)'
    : 'linear-gradient(180deg, #EDEDED 0%, #CFCFCF 45%, #ADADAD 55%, #969696 100%)',
  boxShadow: press
    ? 'inset 0 2px 6px rgba(0,0,0,0.35), 0 0 0 rgba(0,0,0,0)'
    : hover
      ? 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.18)'
      : 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.12)',
  transform: press ? 'translateY(1px)' : 'translateY(0)',
  transitionTimingFunction: T.ease,
  WebkitTapHighlightColor: 'transparent',
  cursor: 'pointer',
  display: 'inline-block',
  textDecoration: 'none',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};