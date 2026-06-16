/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text223244161",
    "max": 0,
    "min": 0,
    "name": "direccionCalle",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select4228912797",
    "maxSelect": 1,
    "name": "estadoKyc",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "aprobado",
      "rechazado"
    ]
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number1585730330",
    "max": null,
    "min": null,
    "name": "trustScore",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1106018968",
    "max": 0,
    "min": 0,
    "name": "direccionNumero",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3288546764",
    "max": 0,
    "min": 0,
    "name": "direccionColonia",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3906025657",
    "max": 0,
    "min": 0,
    "name": "direccionInterior",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2529666875",
    "max": 0,
    "min": 0,
    "name": "direccionMunicipio",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text976250520",
    "max": 0,
    "min": 0,
    "name": "direccionCiudad",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2464908005",
    "max": 0,
    "min": 0,
    "name": "direccionEstado",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3980347168",
    "max": 0,
    "min": 0,
    "name": "direccionCp",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1953481645",
    "max": 0,
    "min": 0,
    "name": "direccionReferencias",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2120499480",
    "max": 0,
    "min": 0,
    "name": "telefonoAlternativo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select2212330713",
    "maxSelect": 1,
    "name": "diaPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "lunes",
      "martes"
    ]
  }))

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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text223244161",
    "max": 0,
    "min": 0,
    "name": "direccion_calle",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select4228912797",
    "maxSelect": 1,
    "name": "estado_kyc",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "aprobado",
      "rechazado"
    ]
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number1585730330",
    "max": null,
    "min": null,
    "name": "puntaje_confianza",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1106018968",
    "max": 0,
    "min": 0,
    "name": "direccion_numero",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3288546764",
    "max": 0,
    "min": 0,
    "name": "direccion_colonia",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(7, new Field({
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

  // update field
  collection.fields.addAt(8, new Field({
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

  // update field
  collection.fields.addAt(9, new Field({
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

  // update field
  collection.fields.addAt(10, new Field({
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

  // update field
  collection.fields.addAt(11, new Field({
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

  // update field
  collection.fields.addAt(12, new Field({
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

  // update field
  collection.fields.addAt(13, new Field({
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

  // update field
  collection.fields.addAt(14, new Field({
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
})
