function checkAuthentication(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized access, reload and authenticate.' });
    }
}

module.exports={
    checkAuthentication,
}