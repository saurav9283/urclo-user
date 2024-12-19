const pool = require("../../../config/database");

module.exports = {
    getmasterService: (callback) => {
        const getMasterQuery = process.env.GET_MASTER_SERVICE;
        // console.log('getMasterQuery: ', getMasterQuery);
        pool.query(getMasterQuery, (err, result) => {
            if (err) {
                console.log(err);
                return callback(err);
            }
            return callback(null, result);
        });
    },
    getcategoryService: (masterid, callback) => {
        const getCategoryQuery = process.env.GET_CATEGORY_SERVICE
        .replace('<master_id>' , masterid);
        console.log('getCategoryQuery: ', getCategoryQuery);
        // console.log('getCategoryQuery: ', getCategoryQuery);
        pool.query(getCategoryQuery, (err, result) => {
            if (err) {
                console.log(err);
                return callback(err);
            }
            return callback(null, result);
        });
    },
    getsubcategoryService: (cat_id, callback) => {
        const getSubCategoryQuery = process.env.GET_SUB_CATEGORY_SERVICE
        .replace('<cat_id>' , cat_id);
        console.log('getSubCategoryQuery: ', getSubCategoryQuery);
        pool.query(getSubCategoryQuery, (err, result) => {
            if (err) {
                console.log(err);
                return callback(err);
            }
            return callback(null, result);
        });
    }
}