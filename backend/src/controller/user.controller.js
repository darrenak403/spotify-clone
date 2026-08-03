import {prisma} from "../lib/prisma.js";
import {toClientShape} from "../lib/serialize.js";
import {isUuid} from "../lib/isUuid.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.dbUser.id;
    const users = await prisma.user.findMany({
      where: {id: {not: currentUserId}},
    });
    res.status(200).json(toClientShape(users));
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const myId = req.dbUser.id;
    const {userId} = req.params;

    if (!isUuid(userId)) {
      return res.status(200).json([]);
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {senderId: userId, receiverId: myId},
          {senderId: myId, receiverId: userId},
        ],
      },
      orderBy: {createdAt: "asc"},
    });

    res.status(200).json(toClientShape(messages));
  } catch (error) {
    next(error);
  }
};
