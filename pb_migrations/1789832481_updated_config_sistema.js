/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3228971969")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number660958454",
    "max": null,
    "min": null,
    "name": "comisionMarketDesliz",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number885932215",
    "max": null,
    "min": null,
    "name": "cuotaAltaVendedor",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "bool885066674",
    "name": "deslizmotoActivo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "bool4025977282",
    "name": "deslizfoodActivo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "bool1927774773",
    "name": "encargosVipActivo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "bool3511784610",
    "name": "publicidadActivo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "bool1245299186",
    "name": "invitacionesActivo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "number2501829125",
    "max": null,
    "min": null,
    "name": "precioPublicidadBasico",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number2575921853",
    "max": null,
    "min": null,
    "name": "precioPublicidadEstandar",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number965046191",
    "max": null,
    "min": null,
    "name": "precioPublicidadPremium",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number1441019889",
    "max": null,
    "min": null,
    "name": "precioInvitacionMin",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number1776879784",
    "max": null,
    "min": null,
    "name": "precioInvitacionMax",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3228971969")

  // remove field
  collection.fields.removeById("number660958454")

  // remove field
  collection.fields.removeById("number885932215")

  // remove field
  collection.fields.removeById("bool885066674")

  // remove field
  collection.fields.removeById("bool4025977282")

  // remove field
  collection.fields.removeById("bool1927774773")

  // remove field
  collection.fields.removeById("bool3511784610")

  // remove field
  collection.fields.removeById("bool1245299186")

  // remove field
  collection.fields.removeById("number2501829125")

  // remove field
  collection.fields.removeById("number2575921853")

  // remove field
  collection.fields.removeById("number965046191")

  // remove field
  collection.fields.removeById("number1441019889")

  // remove field
  collection.fields.removeById("number1776879784")

  return app.save(collection)
})
