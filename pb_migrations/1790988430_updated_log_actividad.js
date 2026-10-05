/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1925455097")

  // update field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "select1166520523",
    "maxSelect": 1,
    "name": "entidad",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "order",
      "payment",
      "user",
      "product",
      "client",
      "tanda",
      "tanda_pago",
      "negocio",
      "cobro",
      "tarjeta",
      "solicitud",
      "kyc",
      "nivel",
      "vacante",
      "vendedor",
      "prestador",
      "config_sistema"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1925455097")

  // update field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "select1166520523",
    "maxSelect": 1,
    "name": "entidad",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "order",
      "payment",
      "user",
      "product",
      "client",
      "tanda",
      "tanda_pago",
      "negocio",
      "cobro",
      "tarjeta",
      "solicitud",
      "kyc",
      "nivel",
      "vacante",
      "vendedor",
      "prestador"
    ]
  }))

  return app.save(collection)
})
