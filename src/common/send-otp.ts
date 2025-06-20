import * as nodemailer from 'nodemailer'

const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'venkatatrinadh4444@gmail.com',
        pass:'rtecerbfluiivezr'
    }
})

export const sendOtpToUser=(email:string,otp:string) => {
    const options={
        from:'venkatatrinadh4444@gmail.com',
        to:email,
        subject:'OTP for password recovery',
        html:`<div>
        <p>Please use the following OTP to verify your identity</p>
        <p>OTP is valid only for two minutes</p>
        <b style="font-size:18px;">${otp}</b>
        </div>`
    }
    transporter.sendMail(options)
}
