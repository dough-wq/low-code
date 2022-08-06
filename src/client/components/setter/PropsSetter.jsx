import EditorContext from '../Block/context'
import { useContext } from 'react'
const PropsSetter = ({block}) => {
  // 这里很关键
  const {forceUpdata} = useContext(EditorContext)
  const onChange = (key,value) => {
    block.props[key] = value
    forceUpdata()   //更新画布视图
  }

  // 根据block类型，映射渲染列表
  const propsList = (() => {
    switch (block.type){
      case 'button':
        // 映射组件属性对应的setter属性设置器类型
      //  debugger 
        return Object.keys(block.props).map(prop => ({label:prop,value:block.props[prop],setter:'input'}))
      case 'text':
        // debugger
        return Object.keys(block.props).map(prop => ({label:prop,value:block.props[prop],setter:'input'}))
      default:return []
    }
  })()

  return (
    <div className="setter-props-wrapper">
      {propsList.map(prop => (
        <div key={prop} className="setter-item">
          <span className="setter-item-label">{prop.label}:</span>
          <div className="setter-item-control">
            {
              (() => {
                switch (prop.setter){
                  case 'input':
                    return <input value={prop.value} onChange={event => onChange(prop.label,event.target.value)} />
                  default:
                    return null
                }
              })()
            }
          </div>
        </div>
      ))}
    </div>
  )
}

export default PropsSetter
