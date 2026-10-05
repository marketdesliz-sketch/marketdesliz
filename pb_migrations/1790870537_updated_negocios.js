/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // remove field
  collection.fields.removeById("select1309676077")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select1309676077",
    "maxSelect": 1,
    "name": "categoria",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Abarrotes",
      "Accesorios",
      "Agencia de viajes",
      "Antojitos",
      "Barbería",
      "Boutique",
      "Cafetería",
      "Carnicería",
      "Cerrajería",
      "Ciber",
      "Consultorio médico",
      "Dulcería",
      "Estética",
      "Farmacia",
      "Ferretería",
      "Florería",
      "verdulería",
      "Heladería",
      "Imprenta",
      "Joyería",
      "Lavandería",
      "Lonchería",
      "Papelería",
      "Panadería",
      "Pastelería",
      "Peluquería",
      "Pescadería",
      "Pollería",
      "Refaccionaria",
      "Restaurante",
      "Taquería",
      "Taller mecánico",
      "Taller de costura",
      "Tienda de ropa",
      "Tienda de electrónicos",
      "Tortillería",
      "Veterinaria",
      "Zapatería"
    ]
  }))

  return app.save(collection)
})
