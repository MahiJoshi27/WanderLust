const express = require("express");
const app = express();
const mongoose = require ("mongoose");
const Listing = require("./models/listing.js");
const path = require("path"); //for setting of ejs file 
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressErrror = require("./utils/ExpressError.js");
const {listingSchema } = require("./schema.js");
const Review = require("./models/reviews.js");




const MONGO_URL ="mongodb://127.0.0.1:27017/Wanderlust";

main()
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.log(err);
});


async function main() {
    await mongoose.connect(MONGO_URL);
}



app.set("view engine", "ejs"); 
app.set("views", path.join(__dirname, "views")); //setting of ejs file
app.use(express.urlencoded({ extended: true })); //for parsing the body of the request
app.use(methodOverride("_method")); //for overriding the method of the request or to covert the post request to put request
app.engine("ejs", ejsMate); //for using html ejs-mate for layouts
app.use(express.static(path.join(__dirname, "public"))); //for using the static files like css and js




app.get("/", (req, res) => {
    res.send("Hi I am a root");
});


const validateListing = (req, res, next) =>{
    let {error}= listingSchema.validate(req.body);
    
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else{
        next();
    }
}



// Index Route 


app.get("/listings", wrapAsync(async (req, res) => {
   const allListings = await Listing.find({});
   res.render("listings/index", { allListings });
}));


//New Route

app.get("/listings/new", (req, res) => {
    res.render("listings/new");
});


// Show Route

app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show", { listing });
    
}));

// Create Route

app.post(
    "/listings", validateListing,
    wrapAsync(async (req, res , next) => {   
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

//Edit Route

app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", { listing });

}));

//Update Route7

app.put(
    "/listings/:id",
    validateListing,
    wrapAsync(async (req, res) => {
    if(!req.body.listing) {
            throw new ExpressError(400 , "Send Valid data for listings");
        }
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);
})
);


//Delete Route

app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));


// Reviews Route
app.post("/listings/:id/reviews", async(req, res) =>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    console.log("New Review saved");
    res.send("New review saved");

});



// app.get("/testListing", async(req, res) => {   
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Goa",
//         country: "India",
//     });


//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");

// });


app.all("/{*splat}" , (req, res , next) => {
    next(new ExpressError(404 ,"Page not Found!" ));
});


app.use((err , req , res, next) => {
    let{statusCode=500 , message= "Something went Wrong!"} = err;
    res.status(statusCode).render("error.ejs" , {message} );
   // res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log("Server is listening to port 8080");
});