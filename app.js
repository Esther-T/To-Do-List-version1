const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
port = 663;

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items:[itemsSchema]
};

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your to do list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "← Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res){
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0)
    {
       Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(error);
        }
        else {
          console.log("successfully saved default items into db");
        }
      })
    res.redirect("/");
    }
    else {
        res.render('list', {listTitle : "What's Left To Do", newListItem: foundItems});
    }
  })
})

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today")
  {
    item.save(); // mongo shortcut for a single item
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today")
  {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err){
        console.log(err);
      }
      else {
        console.log("successfully deleted from db");
      }
    })
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err)
      {
        res.redirect("/" + listName);
      }
    })
  }

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", {listTitle: foundList.name, newListItem: foundList.items});
      }
    }
  });
});

app.listen(port, function(){
  console.log("Server is running on port " + port);
});
