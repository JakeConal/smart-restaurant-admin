// customer-google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

type GoogleProfile = {
  name: { givenName?: string; familyName?: string };
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
};

@Injectable()
export class CustomerGoogleStrategy extends PassportStrategy(
  Strategy,
  'customer-google',
) {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
      throw new Error('Missing Google OAuth configuration');
    }

    super({
      clientID,
      clientSecret,
      callbackURL:
        configService.get<string>('GOOGLE_CUSTOMER_CALLBACK_URL') ||
        'http://localhost:3001/customer-auth/customer/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    const { name, emails, photos } = profile;
    const primaryEmail = emails?.[0]?.value;

    if (!primaryEmail) {
      done(new Error('Google account did not return an email'), false);
      return;
    }

    const user = {
      email: primaryEmail,
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      profilePictureUrl: photos?.[0]?.value || null,
      accessToken,
    };
    done(null, user);
  }
}
