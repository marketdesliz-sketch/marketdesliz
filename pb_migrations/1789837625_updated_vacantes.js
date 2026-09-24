/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" || @request.auth.id = \"\"",
    "listRule": "@request.auth.id != \"\" && (userId = @request.auth.id || @request.auth.role = \"admin\")",
    "updateRule": "@request.auth.id = userId || @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" && (userId = @request.auth.id || @request.auth.role = \"admin\")"
  }, collection)

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number2515135687",
    "max": null,
    "min": null,
    "name": "pasoActual",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "bool2882213148",
    "name": "activo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2835243259",
    "max": 0,
    "min": 0,
    "name": "notasAdmin",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "bool4140040464",
    "name": "aceptaRequisitos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "date299720666",
    "max": "",
    "min": "",
    "name": "fechaAceptaRequisitos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "json1240522036",
    "maxSize": 0,
    "name": "diasDisponibles",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text168575076",
    "max": 0,
    "min": 0,
    "name": "horaInicio",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3057462905",
    "max": 0,
    "min": 0,
    "name": "horaFin",
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
    "id": "number1415267446",
    "max": null,
    "min": null,
    "name": "edad",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2391147934",
    "max": 0,
    "min": 0,
    "name": "ciudad",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text766385355",
    "max": 0,
    "min": 0,
    "name": "motivacion",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3552952631",
    "max": 0,
    "min": 0,
    "name": "tipoTransporte",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(25, new Field({
    "hidden": false,
    "id": "bool2611359354",
    "name": "entrevistaCompletada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(26, new Field({
    "hidden": false,
    "id": "bool318903204",
    "name": "aceptado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "hidden": false,
    "id": "date3250240376",
    "max": "",
    "min": "",
    "name": "fechaAceptacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(28, new Field({
    "hidden": false,
    "id": "file140675097",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "ineFrontal",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(29, new Field({
    "hidden": false,
    "id": "file6483378",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "ineTrasero",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(30, new Field({
    "hidden": false,
    "id": "file1612927668",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "comprobanteDomicilio",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(31, new Field({
    "hidden": false,
    "id": "file196089548",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "selfieConIne",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(32, new Field({
    "hidden": false,
    "id": "bool1221353101",
    "name": "cuotaPagada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(33, new Field({
    "hidden": false,
    "id": "date2516143999",
    "max": "",
    "min": "",
    "name": "fechaPagoCuota",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(34, new Field({
    "hidden": false,
    "id": "bool2075417858",
    "name": "capacitacionCompletada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(35, new Field({
    "hidden": false,
    "id": "bool538628799",
    "name": "uniformeEntregado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(36, new Field({
    "hidden": false,
    "id": "date1478749378",
    "max": "",
    "min": "",
    "name": "fechaCapacitacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(37, new Field({
    "hidden": false,
    "id": "bool2519752057",
    "name": "evaluacionCompletada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(38, new Field({
    "hidden": false,
    "id": "number374549556",
    "max": null,
    "min": null,
    "name": "puntajeEvaluacion",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(39, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation856794818",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "evaluadorId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(40, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2123876060",
    "max": 0,
    "min": 0,
    "name": "notasEvaluacion",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(41, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation1689669068",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "userId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

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
      "en_progreso",
      "aprobado",
      "rechazado",
      "abandonado",
      "activado"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = \"\" || @request.auth.id != \"\"",
    "listRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"admin\""
  }, collection)

  // remove field
  collection.fields.removeById("number2515135687")

  // remove field
  collection.fields.removeById("bool2882213148")

  // remove field
  collection.fields.removeById("text2835243259")

  // remove field
  collection.fields.removeById("bool4140040464")

  // remove field
  collection.fields.removeById("date299720666")

  // remove field
  collection.fields.removeById("json1240522036")

  // remove field
  collection.fields.removeById("text168575076")

  // remove field
  collection.fields.removeById("text3057462905")

  // remove field
  collection.fields.removeById("number1415267446")

  // remove field
  collection.fields.removeById("text2391147934")

  // remove field
  collection.fields.removeById("text766385355")

  // remove field
  collection.fields.removeById("text3552952631")

  // remove field
  collection.fields.removeById("bool2611359354")

  // remove field
  collection.fields.removeById("bool318903204")

  // remove field
  collection.fields.removeById("date3250240376")

  // remove field
  collection.fields.removeById("file140675097")

  // remove field
  collection.fields.removeById("file6483378")

  // remove field
  collection.fields.removeById("file1612927668")

  // remove field
  collection.fields.removeById("file196089548")

  // remove field
  collection.fields.removeById("bool1221353101")

  // remove field
  collection.fields.removeById("date2516143999")

  // remove field
  collection.fields.removeById("bool2075417858")

  // remove field
  collection.fields.removeById("bool538628799")

  // remove field
  collection.fields.removeById("date1478749378")

  // remove field
  collection.fields.removeById("bool2519752057")

  // remove field
  collection.fields.removeById("number374549556")

  // remove field
  collection.fields.removeById("relation856794818")

  // remove field
  collection.fields.removeById("text2123876060")

  // remove field
  collection.fields.removeById("relation1689669068")

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
      "activado",
      "desactivado"
    ]
  }))

  return app.save(collection)
})
