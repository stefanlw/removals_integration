var express = require('express'),
    router = express.Router(),
    json_wrangler = require("../lib/json_wrangler");

/* GET home page. */
router.post('/', function(req, res, next) {
    req.setEncoding("utf8");
    //var postData = Object.keys(req.body)[0];
    var postData = req.body;
console.log(req.body);
console.log(typeof(postData));
console.log(postData);
    JW = new json_wrangler(true);
    try{
        JW.consume(postData,function(success, error){})
            .then(function(obj){
                res.status(200).json({"status":"OK"});
                io.emit("centre-update",postData);
            })
            .then(function(){
                JW.update_centres();
            })
            .then(null,function(err){
                res.status(404).json({"status":"ERROR","error":err});
        });
    }catch(err){
        res.status(400).json({"status":"ERROR","error":err});
    }
});

module.exports = router;

