/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2757060279")

  // remove field
  collection.fields.removeById("select1309676077")

  // add field
  collection.fields.addAt(37, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2687480828",
    "hidden": false,
    "id": "relation4180551237",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "categoriaId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2757060279")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1309676077",
    "maxSelect": 1,
    "name": "categoria",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Plomería",
      "Electricidad",
      "Albañilería",
      "Pintura",
      "Carpintería",
      "Herrería",
      "Jardinería",
      "Limpieza",
      "Aire acondicionado",
      "Refrigeración",
      "Cerrajería",
      "Computación",
      "Celulares",
      "Belleza",
      "Fotografía",
      "Música",
      "Eventos",
      "Pastelería",
      "Catering",
      "Mudanzas",
      "Mecánica",
      "Veterinaria",
      "Florería",
      "Entrega en moto",
      "Eventos especiales",
      "Otro"
    ]
  }))

  // remove field
  collection.fields.removeById("relation4180551237")

  return app.save(collection)
})
