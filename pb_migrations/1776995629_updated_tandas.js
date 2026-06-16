/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2482852971")

  // remove field
  collection.fields.removeById("number2392944706")

  // remove field
  collection.fields.removeById("number3141152758")

  // remove field
  collection.fields.removeById("number1956227788")

  // remove field
  collection.fields.removeById("date1269603864")

  // remove field
  collection.fields.removeById("select2063623452")

  // remove field
  collection.fields.removeById("select645904403")

  // remove field
  collection.fields.removeById("text3940940989")

  // remove field
  collection.fields.removeById("number682505353")

  // remove field
  collection.fields.removeById("text1843675174")

  // remove field
  collection.fields.removeById("relation3545646658")

  // remove field
  collection.fields.removeById("number3767909221")

  // remove field
  collection.fields.removeById("number944533700")

  // remove field
  collection.fields.removeById("number1099410099")

  // remove field
  collection.fields.removeById("number4006693837")

  // remove field
  collection.fields.removeById("bool1282619419")

  // remove field
  collection.fields.removeById("number3481378062")

  // remove field
  collection.fields.removeById("bool1159713107")

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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2482852971")

  // add field
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

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number3141152758",
    "max": null,
    "min": null,
    "name": "totalMembers",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number1956227788",
    "max": null,
    "min": null,
    "name": "totalRounds",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date1269603864",
    "max": "",
    "min": "",
    "name": "startDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
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

  // add field
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

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3940940989",
    "max": 0,
    "min": 0,
    "name": "collectionDay",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number682505353",
    "max": null,
    "min": null,
    "name": "gasFee",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1843675174",
    "max": 0,
    "min": 0,
    "name": "descripcion",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3545646658",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "userId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "number3767909221",
    "max": null,
    "min": null,
    "name": "nivelRequerido",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number944533700",
    "max": null,
    "min": null,
    "name": "productosRequeridos",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number1099410099",
    "max": null,
    "min": null,
    "name": "cupoMaximo",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number4006693837",
    "max": null,
    "min": null,
    "name": "cupoDisponible",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "bool1282619419",
    "name": "activa",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "number3481378062",
    "max": null,
    "min": null,
    "name": "miembrosActuales",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "bool1159713107",
    "name": "esPlantilla",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

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

  return app.save(collection)
})
