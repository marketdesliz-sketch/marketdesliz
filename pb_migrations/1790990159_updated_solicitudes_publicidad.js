/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3412667277")

  // update field
  collection.fields.addAt(12, new Field({
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
      "activo",
      "cancelada",
      "completada",
      "aprobada",
      "contactada"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3412667277")

  // update field
  collection.fields.addAt(12, new Field({
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
      "contactado",
      "aprobado",
      "activo",
      "completado",
      "cancelado"
    ]
  }))

  return app.save(collection)
})
