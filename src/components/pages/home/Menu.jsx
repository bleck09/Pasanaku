import React from "react";
import "./Menu.css";

const menuItems = [
  {
    id: 1,
    title: "Pollo a la parrilla Sagrada",
    description: "Marinado con especias de la casa y dorado lentamente hasta lograr piel crujiente y carne jugosa",
    price: "30",
    unit: "Bs.",
    image: "/FuegoSagrado/imagenes/Pollo a la parrilla Sagrada.png",
    ingredients: ["Pollo", "Arroz", "Papas fritas", "Ensalada"],
    reverse: false
  },
  {
    id: 2,
    title: "Churrasco del Sello",
    description: "Corte jugoso, marcando al fuego vivo, sellado a la parrilla con nuestro toque especial.",
    price: "35",
    unit: "Bs.",
    image: "/FuegoSagrado/imagenes/Churrasco del Sello.png",
    ingredients: ["Carne", "Arroz", "Papas fritas", "Ensalada"],
    reverse: true 
  },
  {
    id: 3,
    title: "Asado de tira Ancestral",
    description: "Costilla seleccionada, coccion lenta sobre brasas intensas para lograr suavidad y sabor profundo.",
    price: "70",
    unit: "Bs.",
    image: "/FuegoSagrado/imagenes/Asado de tira Ancestral.png",
    ingredients: ["Costilla", "Arroz", "Papas fritas", "Ensalada"],
    reverse: false 
  }
];

const Menu = () => {
  return (
    <section className="menu-section">
      <h2 className="menu-title">
        Donde la <span className="highlight">Maestría</span> se une al Sabor
      </h2>
      
      <div className="menu-container">
        {menuItems.map((item) => (
          <div key={item.id} className={`menu-card ${item.reverse ? "reverse" : ""}`}>
            
            <div className="card-info">
              <h3>{item.title}</h3>
              <p className="description">{item.description}</p>
              
              <div className="ingredients-grid">
                {item.ingredients.map((ing, index) => (
                  <div key={index} className="ingredient-item">
                    <span className="orange-dot"></span>
                    <span>{ing}</span>
                  </div>
                ))}
              </div>

              <div className="status-bars">
                <div className="bar bar-orange"></div>
                <div className="bar bar-beige"></div>
                <div className="bar bar-green"></div>
              </div>

              <div className="card-footer">
                <button className="btn-3d">Ver en 3D</button>
                <div className="price-container">
                  <span className="price-value">{item.price}</span>
                  <span className="price-unit">{item.unit}</span>
                </div>
              </div>
            </div>

            <div className="card-image-container">
              <img src={item.image} alt={item.title} className="plate-img" />
            </div>

          </div>
        ))}
      </div>
    </section>
  );
};

export default Menu;