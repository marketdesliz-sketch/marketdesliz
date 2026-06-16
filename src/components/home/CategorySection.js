export default function CategorySection(){

  const categories=[
    {name:"Electrónica",icon:"📷"},
    {name:"Hogar",icon:"🛋️"},
    {name:"Moda",icon:"👗"},
    {name:"Servicios",icon:"🛠️"}
  ]

  return(

    <div
      style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:"20px"
      }}
    >

      {categories.map((c,i)=>(

        <div
          key={i}
          style={{
            background:"white",
            borderRadius:"12px",
            padding:"20px",
            textAlign:"center",
            boxShadow:"0 4px 10px rgba(0,0,0,0.05)",
            cursor:"pointer",
            transition:"0.2s"
          }}
        >

          <div style={{fontSize:"30px"}}>
            {c.icon}
          </div>

          <p style={{marginTop:"8px"}}>
            {c.name}
          </p>

        </div>

      ))}

    </div>

  )

}
