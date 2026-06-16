/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2482852971")

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "number292700651",
    "max": null,
    "min": null,
    "name": "montoCuota",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text479566075",
    "max": 0,
    "min": 0,
    "name": "diaPago",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "date3302068418",
    "max": "",
    "min": "",
    "name": "fechaInicio",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "date1691770024",
    "max": "",
    "min": "",
    "name": "fechaFinEstimada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation35456466582",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "createdBy",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number2392944706",
    "max": null,
    "min": null,
    "name": "montoTotal",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "abierta",
      "completada",
      "en_curso",
      "cancelada"
    ]
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select645904403",
    "maxSelect": 1,
    "name": "frecuencia",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "semanal",
      "quincenal",
      "mensual"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2482852971")

  // remove field
  collection.fields.removeById("number292700651")

  // remove field
  collection.fields.removeById("text479566075")

  // remove field
  collection.fields.removeById("date3302068418")

  // remove field
  collection.fields.removeById("date1691770024")

  // remove field
  collection.fields.removeById("relation35456466582")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number2392944706",
    "max": null,
    "min": null,
    "name": "monto",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "abierta",
      "activa",
      "completada"
    ]
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select645904403",
    "maxSelect": 1,
    "name": "frequency",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "weekly",
      "biweekly",
      "monthly"
    ]
  }))

  return app.save(collection)
})
