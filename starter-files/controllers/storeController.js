const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");
const User = mongoose.model("User");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn'nt allowed!" }, false);
    }
  }
};

exports.homeController = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", {
    title: "Add Store"
  });
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully created. ${store.name}. Care to leave a review.`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  }

  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render("stores", {
    title: "Stores",
    stores
  });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error("You must own a store in order to edit it!");
  }
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  confirmOwner(store, req.user);
  res.render("editStore", {
    title: `Edit ${store.name}`,
    store
  });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = "Point";
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true
  }).exec();
  req.flash(
    "success",
    `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params["slug"] }).populate(
    "author reviews"
  );
  if (!store) return next();

  res.render("store", {
    store,
    title: store.nome
  });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params["tag"];
  const tagQuery = tag || { $exists: true };
  const storesPromise = Store.find({ tags: tagQuery });
  const tagsPromise = Store.getTagsList();
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render("tag", {
    stores,
    tags,
    tag,
    title: "Tags"
  });
};

exports.searchStores = async (req, res) => {
  const stores = await Store.find(
    {
      $text: {
        $search: req.query.q
      }
    },
    {
      score: { $meta: "textScore" }
    }
  )
    .sort({
      score: { $meta: "textScore" }
    })
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates
        },
        $maxDistance: 10000 //10km
      }
    }
  };

  const stores = await Store.find(q)
    .select("slug name description location")
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render("map", {
    title: "Map"
  });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? "$pull" : "$addToSet";
  const user = await User.findOneAndUpdate(
    req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );

  res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in : req.user.hearts}
  });
  res.render('stores', {
    title: 'Hearted Stores',
    stores
  })
}