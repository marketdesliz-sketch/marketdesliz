/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number777123888",
    "max": null,
    "min": null,
    "name": "productos_comprados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "number2386483518",
    "max": null,
    "min": null,
    "name": "productos_pagados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "number1265192798",
    "max": null,
    "min": null,
    "name": "productos_en_curso",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "number3942894169",
    "max": null,
    "min": null,
    "name": "deuda_actual",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "number4139286901",
    "max": null,
    "min": null,
    "name": "limite_deuda",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "date3220005127",
    "max": "",
    "min": "",
    "name": "fecha_primer_producto",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "date429514562",
    "max": "",
    "min": "",
    "name": "fecha_ultimo_producto",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(23, new Field({
    "hidden": false,
    "id": "bool1233992686",
    "name": "datos_completos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update field
  collection.fields.addAt(16, new Field({
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

  // update field
  collection.fields.addAt(17, new Field({
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

  // update field
  collection.fields.addAt(18, new Field({
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

  // update field
  collection.fields.addAt(19, new Field({
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

  // update field
  collection.fields.addAt(20, new Field({
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

  // update field
  collection.fields.addAt(21, new Field({
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

  // update field
  collection.fields.addAt(22, new Field({
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

  // update field
  collection.fields.addAt(23, new Field({
    "hidden": false,
    "id": "bool1233992686",
    "name": "datosCompletos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
