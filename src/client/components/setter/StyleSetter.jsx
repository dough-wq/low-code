import { useContext } from "react"
import EditorContext from "../Block/context"
import './StyleSetter.css'
const StyleSetter = ({block}) => {
  const {forceUpdate} = useContext(EditorContext)

  // 修改普通样式
  const onChange = (key,value) => {
   block.style[key] = Number(value)
   forceUpdate()  //更新画布视图
  }
  // 修改颜色
  const onChangeColor = (key,value) => {
    block.style[key] = String(value)
    forceUpdate()  //更新画布视图
   }
//  debugger

  return (
    <div className="style-setter-wrapper">
      {/* {Object.keys(block.style).map(key => (
        <div className="setter-item" key={key}>
          <div className="setter-item-control">            */}
          {
           Object.keys(block.style).map((key) => {
              switch (key) {
                case 'color':
                  return (
                  <div className="setter-item-label">
                    <div className="style-name">{key}:</div>
                    <input type="color" onChange={event => onChangeColor(key,(event.target.value))}  /> </div>
                  )           
                default:
                  return <div className="setter-item-label">
                    <div className="style-name">{key}:</div>
                    <input type="text"   value={block.style[key]} onChange={event => onChange(key,event.target.value)} /> </div>
                  // debugger
              }
            })    
          }       
          {/* </div>
        </div>
      ))} */}
    </div>
    
  )
  
}
export default StyleSetter
