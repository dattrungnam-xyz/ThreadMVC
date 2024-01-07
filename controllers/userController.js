import { User } from "../models/userModel.js";
import { AppError } from "../utils/appError.js";

let userController = {
  filterBody: function (obj, ...excludeField) {
    Object.keys(obj).forEach((field) => {
      if (excludeField.includes(field)) {
        delete obj[field];
      }
    });
  },
  updateProfile: async function (req, res, next) {
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates. Please use /updateMyPassword.",
          400
        )
      );
    }

    userController.filterBody(
      req.body,
      "password",
      "email",
      "passwordConfirm",
      "active",
      "followers",
      "following",
      "private"
    );

    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({
      status: "success",
      data: {
        user: user,
      },
    });
  },
  setPrivate: async function (req, res, next) {
    let privateAccount = req.body.privateAccount;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { private: privateAccount },
      {
        new: true,
      }
    );
    return res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  },
  follow: async function (req, res, next) {
    let userRequest = await User.findById(req.user.id);
    let userFollow = await User.findById(req.params.id);

    let indexOfUserFollow = userRequest.following.indexOf(req.params.id);
    let indexOfUserRequest = userFollow.followers.indexOf(req.user.id);

    if (indexOfUserFollow != -1 || indexOfUserRequest != -1) {
      return next(new AppError("Your account already follow this user!", 400));
    }

    //public
    if (!userFollow.private) {
      userRequest.following.push(req.params.id);

      userFollow.followers.push(req.user.id);
    } else {
      userRequest.followingRequest.push(req.params.id);

      userFollow.followerRequest.push(req.user.id);
    }
    await userRequest.save({ validateBeforeSave: false });
    await userFollow.save({ validateBeforeSave: false });

    userRequest = await User.findById(req.user.id);
    return res.status(200).json({
      status: "success",
      data: {
        user: userRequest,
      },
    });
  },

  unfollow: async function (req, res, next) {
    let userCurrent = await User.findById(req.user.id);
    let userUnfollow = await User.findById(req.params.id);

    let indexOfUserCurrent = userUnfollow.followers.indexOf(req.user.id);
    let indexOfUserUnfollow = userCurrent.following.indexOf(req.params.id);

    if (indexOfUserCurrent === -1 || indexOfUserUnfollow === -1) {
      return next(
        new AppError("Your account haven't follow this user yet!", 400)
      );
    }

    userCurrent.following.splice(indexOfUserUnfollow, 1);
    userUnfollow.followers.splice(indexOfUserCurrent, 1);

    await userCurrent.save({ validateBeforeSave: false });
    await userUnfollow.save({ validateBeforeSave: false });

    userCurrent = await User.findById(req.user.id);
    return res.status(200).json({
      status: "success",
      data: {
        user: userCurrent,
      },
    });
  },
  removeFollower: async function (req, res, next) {
    let userCurrent = await User.findById(req.user.id);
    let userRemove = await User.findById(req.params.id);

    let indexOfUserCurrent = userRemove.following.indexOf(req.user.id);
    let indexOfUserRemove = userCurrent.followers.indexOf(req.params.id);

    if (indexOfUserCurrent === -1 || indexOfUserRemove === -1) {
      return next(new AppError("This account haven't follow you yet!", 400));
    }

    userCurrent.followers.splice(indexOfUserRemove, 1);
    userRemove.following.splice(indexOfUserCurrent, 1);

    await userCurrent.save({ validateBeforeSave: false });
    await userRemove.save({ validateBeforeSave: false });

    userCurrent = await User.findById(req.user.id);
    return res.status(200).json({
      status: "success",
      data: {
        user: userCurrent,
      },
    });
  },
  handleRequestFollow: async function (req, res, next) {
    let currentUser = await User.findById(req.user.id);
    let userRequest = await User.findById(req.params.id);

    let indexOfUserRequest = currentUser.followerRequest.indexOf(req.params.id);
    let indexOfCurrentUser = userRequest.followingRequest.indexOf(req.user.id);

    if (indexOfUserRequest === -1 || indexOfCurrentUser === -1) {
      return next(
        new AppError("This user does't request follow your account!", 400)
      );
    }

    currentUser.followerRequest.splice(indexOfUserRequest, 1);
    userRequest.followingRequest.splice(indexOfCurrentUser, 1);

    let decision = req.body.decision;

    // if approved, add to follower and following
    if (decision) {
      currentUser.followers.push(req.params.id);
      userRequest.following.push(req.user.id);
    }

    await currentUser.save();
    await userRequest.save();

    currentUser = await User.findById(req.user.id);

    return res.status(200).json({
      status: "success",
      data: {
        user: currentUser,
      },
    });
  },
  getUser: async function (req, res, next) {
    let userCurrent = await User.findById(req.params.id)
      .populate("followers")
      .populate("following")
      .populate("followingRequest")
      .populate("followerRequest");
    return res.status(200).json({
      status: "success",
      data: {
        user: userCurrent,
      },
    });
  },
};

export { userController };
