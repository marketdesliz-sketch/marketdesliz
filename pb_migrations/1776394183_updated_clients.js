/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_U35wa3haia` ON `clientes` (`telefono`)"
    ],
    "name": "clientes"
  }, collection)

  // add field
  collection.fields.addAt(11, new Field({
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

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3906025657",
    "max": 0,
    "min": 0,
    "name": "direccion_interior",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2529666875",
    "max": 0,
    "min": 0,
    "name": "direccion_municipio",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text976250520",
    "max": 0,
    "min": 0,
    "name": "direccion_ciudad",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2464908005",
    "max": 0,
    "min": 0,
    "name": "direccion_estado",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3980347168",
    "max": 0,
    "min": 0,
    "name": "direccion_cp",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1953481645",
    "max": 0,
    "min": 0,
    "name": "direccion_referencias",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2120499480",
    "max": 0,
    "min": 0,
    "name": "telefono_alternativo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "select2212330713",
    "maxSelect": 1,
    "name": "dia_pago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "lunes",
      "martes"
    ]
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "number2868650187",
    "max": null,
    "min": null,
    "name": "nivel",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "number777123888",
    "max": null,
    "min": null,
    "name": "productosComprados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "number2386483518",
    "max": null,
    "min": null,
    "name": "productosPagados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "hidden": false,
    "id": "number1265192798",
    "max": null,
    "min": null,
    "name": "productosEnCurso",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "hidden": false,
    "id": "number3942894169",
    "max": null,
    "min": null,
    "name": "deudaActual",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(25, new Field({
    "hidden": false,
    "id": "number4139286901",
    "max": null,
    "min": null,
    "name": "limiteDeuda",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(26, new Field({
    "hidden": false,
    "id": "date3220005127",
    "max": "",
    "min": "",
    "name": "fechaPrimerProducto",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "hidden": false,
    "id": "date429514562",
    "max": "",
    "min": "",
    "name": "fechaUltimoProducto",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_U35wa3haia` ON `clients` (`telefono`)"
    ],
    "name": "clients"
  }, collection)

  // remove field
  collection.fields.removeById("relation1689669068")

  // remove field
  collection.fields.removeById("text3906025657")

  // remove field
  collection.fields.removeById("text2529666875")

  // remove field
  collection.fields.removeById("text976250520")

  // remove field
  collection.fields.removeById("text2464908005")

  // remove field
  collection.fields.removeById("text3980347168")

  // remove field
  collection.fields.removeById("text1953481645")

  // remove field
  collection.fields.removeById("text2120499480")

  // remove field
  collection.fields.removeById("select2212330713")

  // remove field
  collection.fields.removeById("number2868650187")

  // remove field
  collection.fields.removeById("number777123888")

  // remove field
  collection.fields.removeById("number2386483518")

  // remove field
  collection.fields.removeById("number1265192798")

  // remove field
  collection.fields.removeById("number3942894169")

  // remove field
  collection.fields.removeById("number4139286901")

  // remove field
  collection.fields.removeById("date3220005127")

  // remove field
  collection.fields.removeById("date429514562")

  return app.save(collection)
})
