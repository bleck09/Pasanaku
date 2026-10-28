
import React from 'react'


import './Productos.css';
import TextoDesvanecido from "../../secciones/textos/textoDesvanecido/TextoDesvanecido";
import Ubicacion from '../../secciones/ubicacion/Ubicacion';


function Products() {

 const cardsData = [
    {
      id: 1,
      img: "/Luis/imagenes/luisfoto.png",
      title: 'Foto Luis Miguel',
    },
    // Si agregas más tarjetas, esta lógica solo usará la primera (índice 0)
  ];

  // 1. Obtener la imagen de la primera tarjeta
  const principalImageSrc = cardsData[0].img;

  // 2. Obtener el título principal de la primera tarjeta
  const principalTitle = cardsData[0].title;


  return (
    <>
      <section className='sec_foto'>
        <TextoDesvanecido text="Mi Primera Comunión" delay={500} animateBy="words" className='Titulo_adri' />
        {/* CORRECCIÓN: Usamos la URL de la imagen del primer elemento del array */}
        <img src={principalImageSrc} alt={principalTitle} className="principal-img" />
        
        {/* Si quieres mostrar un nombre, usa un texto directo */}
        <TextoDesvanecido text="Luis Miguel" delay={500} animateBy="words" className='Titulo_adri' />
      </section>
      <section className='sec_musica'>
       
      </section>
      <section className='sec_inicio'>
        <TextoDesvanecido text="Señor, Gracias por permitirme llegar a este dia tan especial, en el que por primera vez recibire tu cuerpo y tu amor en la Sagrada Comunión. Gracias por acompañarme, cuidarme y enseñarme a caminar en tu luz. te entrego mi corazon con alegria y fe, y te pido que siempre estes conmigo, guiando cada paso de mi vida. Amén " delay={500} animateBy="words" className='Titulo_adri' />
      </section>
      <TextoDesvanecido text="Mis Padres" delay={50} animateBy="words" className='Titulo_adri' />
      <section className='sec_inicio_parteInferior'>
        
        <p className='Texto_contenido_titulo'>
          Francisco Chambi Correa
        </p>
        <p className='Texto_contenido_titulo'>
          Agustina Mamani Inca
        </p>
      </section>


      <section className='sec_fechaEvento'>
        <TextoDesvanecido text="Fecha del evento" delay={500} animateBy="words" className='Titulo_adri' />
       
      </section>

      <section className='sec_cuentaRegresiva'>
        <TextoDesvanecido text="Faltan" delay={500} animateBy="words" className='Titulo_adri' />
       
      </section>

      <section className='sec_ubicacion'>
        <TextoDesvanecido text="Ubicación" delay={500} animateBy="words" className='Titulo_adri' />
        <Ubicacion/>
      </section>


      
      

      
      






    </>

  )
}

export default Products
