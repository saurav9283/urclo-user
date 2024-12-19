const { getmasterService, getcategoryService, getsubcategoryService } = require("./user.service.service");

module.exports = {
    getMasterserviceController: (req, res) => {
        getmasterService((err, result) => {
            if (err) {
                console.log(err);
                return;
            }
             return res.json(result);
        });
    },
    getCategoryController: (req, res) => {
        const {masterid} = req.query;
        getcategoryService(masterid, (err, result) => {
            if (err) {
                console.log(err);
                return;
            }
            return res.json(result);
        });
    },
    getSubCategoryController: (req, res) => {
        const {cat_id} = req.query;
        getsubcategoryService(cat_id, (err, result) => {
            if (err) {
                console.log(err);
                return;
            }
            return res.json(result);
        });
    }
}