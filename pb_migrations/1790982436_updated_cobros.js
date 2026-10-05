/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4276131293")

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select643686883",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "no_encontrado",
      "cancelada",
      "completada"
    ]
  }))

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "date3182785041",
    "max": "",
    "min": "",
    "name": "fechaCompletada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4276131293")

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select643686883",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "no_encontrado",
      "completado"
    ]
  }))

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "date3182785041",
    "max": "",
    "min": "",
    "name": "fechaCompletado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
