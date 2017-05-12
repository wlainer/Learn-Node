const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next)  {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({message: 'That filetype isn\'nt allowed!'}, false);
    }
  }
}

exports.homeController = (req, res) => {
  res.render('index');
}


exports.addStore = (req, res) => {
  res.render('editStore', {
    title:'Add Store'
  });
}


exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();  
  req.flash('success', `Successfully created. ${store.name}. Care to leave a review.`);
  res.redirect(`/store/${store.slug}`);
}


exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if(!req.file) {
    next();
    return;
  }

  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', {
    title: 'Stores',
    stores
  });
}

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  res.render('editStore', {
    title: `Edit ${store.name}`,
    store
  });
}


exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
    new: true,
    runValidators: true
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`) 
  res.redirect(`/stores/${store._id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({slug: req.params['slug']});
  if (!store) return next();

  res.render('store', {
    store,
    title: store.nome
  });
}

exports.getStoresByTag = async (req, res) => {
  const tag = req.params['tag'];
  const tagQuery = tag || { $exists: true};
  const storesPromise = Store.find({tags: tagQuery});
  const tagsPromise = Store.getTagsList();
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
 
  res.render('tag', {
    stores,
    tags,
    tag,
    title: 'Tags'
  });
}
