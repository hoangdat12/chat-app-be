export const activeAccountTemplate = (userName: string, link: string) => `
    Dear ${userName},

    Thank you for signing up for ChatApp! We're excited to have you as a new member of our community.

    To complete your registration, please click on the verification link this to activate your account: ${link}

    Once your email is verified, you'll be able to log in to your account and start exploring all of the amazing features that Fasty has to offer.

    If you have any questions or need assistance with anything, please don't hesitate to reach out to our support team at datttp113@gmail.com.

    Thank you again for choosing Chatapp. We look forward to seeing you inside!

    Best regards,
    ChatApp Team
`;

export const confirmEmail = (userName: string, link: string) => `
Dear ${userName},

As part of our ongoing commitment to keeping your account secure, we recommend changing your password from time to time. If you'd like to change your password now, please click on this link: ${link}

This link will expire in 30 minutes. Please make sure to complete the email change process within this time frame.

This link will take you to a secure page where you can enter your new password. After submitting your new password, you'll be able to log in to your account using your updated credentials.

If you did not request a password change, or if you have any concerns about the security of your account, please contact our support team at datttp113@gmail.com.

Thank you for choosing ChatApp. We appreciate your business and are committed to providing you with the best possible user experience.

Best regards,
Fasty Team`;

export const confirmEmailChangeEmail = (userName: string, link: string) => `
Dear ${userName},

Please ensure that the new email address you provide is valid and accessible, as we will use it for all future communication related to your account.

If you'd like to change your email now, please click on this link: ${link}

This link will expire in 30 minutes. Please make sure to complete the email change process within this time frame.

This link will take you to a secure page where you can enter your new email. After submitting your new email, you'll be able to log in to your account using your updated credentials.

If you encounter any difficulties during this process or have any questions, feel free to contact our support team at datttp113@gmail.com. We will be more than happy to assist you.

Thank you for your prompt attention to this matter. Your cooperation is greatly appreciated. If no action is taken within [deadline date], your account may be temporarily suspended until the email address is updated.

Best regards
Fasty Team`;
