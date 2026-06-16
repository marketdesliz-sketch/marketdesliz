/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.role = \"admin\" || (userId = @request.auth.id && estadoValidacion = \"pendiente\")"
  }, collection)

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "estadoPago",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "pendiente_pago",
      "activa",
      "completada",
      "cancelada",
      "atrasada"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.role = \"admin\" || (userId = @request.auth.id && estado = \"pendiente\")"
  }, collection)

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "pendiente_pago",
      "activa",
      "completada",
      "cancelada",
      "atrasada"
    ]
  }))

  return app.save(collection)
})
