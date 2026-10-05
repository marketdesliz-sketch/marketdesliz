/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_555007670")

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select3329859325",
    "maxSelect": 1,
    "name": "entidadTipo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "solicitud",
      "orden",
      "tanda",
      "negocio",
      "kyc",
      "cobro",
      "pago",
      "tanda_pago",
      "nivel",
      "sistema"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_555007670")

  // remove field
  collection.fields.removeById("select3329859325")

  return app.save(collection)
})
