// customer-google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { CustomerAuthService } from '../customer-auth.service';

@Injectable()
export class CustomerGoogleStrategy extends PassportStrategy(
  Strategy,
  'customer-google',
) {
  constructor(private auth: CustomerAuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CUSTOMER_CALLBACK_URL ||
        'http://localhost:3001/customer-auth/customer/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      profilePictureUrl: photos[0]?.value || null,
      accessToken,
    };
    done(null, user);
  }
}
