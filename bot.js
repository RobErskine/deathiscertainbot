var fs    = require("fs");
var Twit = require('twit');
var T = new Twit(require('./config.js'));
var responses = require('./noneofthismatters-responses.json');
var Jimp = require("jimp");
var Flickr = require("node-flickr");
var keys = {"api_key": '992a5f2498c7d9ef0d8133dcf4cbb0b4'}
flickr = new Flickr(keys);

var messages = responses.length;
var message = responses[Math.floor(Math.random() * Math.floor(messages))];
var attribution = '';

if(message.attribution != ""){
    attribution = '--'+message.attribution;
}

function lifeIsMeaningless(){

    flickr.get("photos.search", {"tags":"bunnies,bunny,puppies,puppy,kittens,kitten,panda,pandas,hedgehog,hedgehogs,penguin,penguins"}, function(err, result){

        if (err) return console.error(err);

        var photos = result.photos.photo;
        var photosLength = result.photos.photo.length;
        var photo = photos[Math.floor(Math.random() * Math.floor(photosLength))];

        console.log(photo);

        //{ id: '25218187427',
        // owner: '138365291@N08',
        // secret: '23fb1d0345',
        // server: '4749',
        // farm: 5,
        // title: 'IMG_9129',
        // ispublic: 1,
        // isfriend: 0,
        // isfamily: 0 }

        // https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
        var url = 'https://farm'+photo.farm+'.staticflickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'.jpg';
    
        console.log("url: " + url);

        Jimp.read(url).then(function (preImage) {

            var image = preImage;

            image.resize(512, Jimp.AUTO)            // resize
                .quality(80)                 // set JPEG quality
                .greyscale()  
                .color([
                    { apply: 'darken', params: [ 30 ] },
                ])

            console.log(message.quote.length);

            var size = message.quote.length;

            // print main message based on length of quote
            if(size >=190){
                Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function (font,cb) {
                    image.print(font, 20, 20, message.quote, 492, Jimp.ALIGN_FONT_CENTER)
                });
            }
            else if(size >= 60){
                Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).then(function (font,cb) {
                    image.print(font, 20, 20, message.quote, 492, Jimp.ALIGN_FONT_CENTER)
                });
            }
            else{
                Jimp.loadFont(Jimp.FONT_SANS_64_WHITE).then(function (font,cb) {
                    image.print(font, 20, 20, message.quote, 492, Jimp.ALIGN_FONT_CENTER)
                });
            }

            // print attribution
            Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function (font) {
                image.print(font, 20, (image.bitmap.height - 30), attribution, 492, Jimp.ALIGN_FONT_LEFT)
                Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function (font) {
                    image.print(font, 10, (image.bitmap.height - 30), 'Photo: https://flickr.com/'+photo.owner, 492, Jimp.ALIGN_FONT_RIGHT)
                    .write("images/image.jpg");
                });
            })
        
        // base64 encode the image
        var b64content = fs.readFileSync('images/image.jpg', { encoding: 'base64' })

        // first we must post the media to Twitter
        T.post('media/upload', { media_data: b64content }, function (err, data, response) {
            // now we can assign alt text to the media, for use by screen readers and
            // other text-based presentations and interpreters
            var mediaIdStr = data.media_id_string
            var altText = message.quote
            var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

            T.post('media/metadata/create', meta_params, function (err, data, response) {
                if (!err) {
                    // now we can reference the media and post a tweet (media will attach to the tweet)
                    var params = { status: message.quote, media_ids: [mediaIdStr] }

                    T.post('statuses/update', params, function (err, data, response) {
                        //console.log(data)
                    })
                }
            })
        });

        }).catch(function (err) {
            console.log(err);
        });
    });
};

lifeIsMeaningless();