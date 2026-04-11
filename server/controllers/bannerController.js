import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import HomeFirstBanner from "../models/bannerModel.js";
import uploadToS3, { deleteFromS3 } from "../services/s3Services.js";
import BrandBanner from "../models/brandBannnerModel.js";


export const getFirstHomeBanners = asyncHandler(async (req, res, next) => {
    const banners = await HomeFirstBanner.find({ isActive: true }).lean();

    res.status(200).json({
        success: true,
        data: banners
    });
});

export const getFirstHomeBannersViaWeb = asyncHandler(async (req, res, next) => {
    const banners = await HomeFirstBanner.find({}).lean();

    res.status(200).json({
        success: true,
        data: banners
    });
});



export const createHomeFirstBanner = asyncHandler(async (req, res, next) => {
    const { title } = req.body;
    if (!req.file) {
        return next(new errorHandler("Image file is required", 400));
    }

    const imageUrl = await uploadToS3(req.file, "banners");
    const banner = await HomeFirstBanner.create({
        image: imageUrl,
        title
    });

    res.status(201).json({
        message: "Banner created successfully",
        success: true,
        data: banner
    });
});

export const updateHomeFirstBanner = asyncHandler(async (req, res, next) => {
    const bannerId = req.params.id;
    const { title } = req.body;

    const banner = await HomeFirstBanner.findById(bannerId);

    if (!banner) {
        return next(new errorHandler("Banner not found", 404));
    }

    let image = banner.image;

    if (req.file) {
        const uploadedImage = await uploadToS3(req.file, "banners");

        if (banner.image?.key) {
            await deleteFromS3(banner.image.key);
        }

        image = uploadedImage;
    }

    banner.image = image;
    banner.title = title || banner.title;

    await banner.save();

    res.status(200).json({
        message: "Banner updated successfully",
        success: true,
        data: banner
    });
});

export const deleteHomeFirstBanner = asyncHandler(async (req, res, next) => {
    const bannerId = req.params.id;

    const banner = await HomeFirstBanner.findById(bannerId);

    if (!banner) {
        return next(new errorHandler("Banner not found", 404));
    }

    if (banner.image) {
        await deleteFromS3(banner.image.key);
    }

    await banner.deleteOne();

    res.status(200).json({
        success: true,
        message: "Banner deleted successfully"
    });
});

export const toggleHomeFirstBannerStatus = asyncHandler(async (req, res, next) => {
    const bannerId = req.params.id;

    const banner = await HomeFirstBanner.findById(bannerId);

    if (!banner) {
        return next(new errorHandler("Banner not found", 404));
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
        message: "Status changed successfully",
        success: true,
        data: banner
    });
});

export const createBrandBanner = asyncHandler(async (req, res, next) => {

    if (!req.file) {
        return next(new errorHandler("Image file must be required", 400));
    }
    const image = await uploadToS3(req.file, "brandBanners");

    const brandBanner = await BrandBanner.create({
        image,
    })

    res.status(201).json({
        success: true,
        message: "Brand Banner created",
        data : brandBanner
    })
})

export const getBrandBannerByUsers = asyncHandler(async (req, res, next) => {
    const brandBanners = await BrandBanner.find({ isActive: true }).select("image").lean();

    res.status(200).json({
        success: true,
        data : brandBanners
    })

})

export const deleteBrandBanner = asyncHandler(async (req, res, next) => {
    const bannerId = req.params.id;

    const banner = await BrandBanner.findById(bannerId);
    if (!banner) {
        return next(new errorHandler("Banner not found", 404));
    }

    if (banner?.image?.key) {
        await deleteFromS3(key);
    }

    banner.deleteOne();

    res.status(200).json({
        success: true,
        message: "Brand Banner deleted successfully"
    })
})

export const toggleStatusBrandBanner = asyncHandler(async (req, res, next) => {
    const bannerId = req.params.id;

    const brandBanner = await BrandBanner.findById(bannerId);

    if (!brandBanner) {
        return next(new errorHandler("Brand Banner not found"));
    }

    brandBanner.isActive = !brandBanner.isActive;

    await brandBanner.save();

    res.status(200).json({
        success: true,
        message: "Banner status updated"
    })
})

export const getAllBrandBanners = asyncHandler(async (req, res, next) => {
    const brandBanners = await BrandBanner.find({}).lean();

    res.status(200).json({
        success : true,
        data : brandBanners
    })
})