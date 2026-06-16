/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // add field
  collection.fields.addAt(36, new Field({
    "hidden": false,
    "id": "select626611930",
    "maxSelect": 1,
    "name": "tarjetaEstado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "activa",
      "perdida",
      "bloqueada",
      "suspendida"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // remove field
  collection.fields.removeById("select626611930")

  return app.save(collection)
})
