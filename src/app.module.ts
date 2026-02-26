import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { BookingsModule } from './bookings/bookings.module';
import { TripsModule } from './trips/trips.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FinanceCronService } from './cron/finance-cron.service';
import { CronModule } from './cron/cron.module';
import { FinanceModule } from './finance/finance.module';
import { RoutesModule } from './routes/routes.module';
import { GoogleMapsService } from './common/google-maps.service';
import { CommonModule } from './common/common.module';
import { DriverModule } from './driver/driver.module';
import { DriverAuthModule } from './driver-auth/driver-auth.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { AppGateway } from './gateways/booking.gateway';

@Module({
  imports: [UsersModule, AuthModule, CustomersModule, BookingsModule, TripsModule, InvoicesModule,
  PaymentsModule, DashboardModule , ScheduleModule.forRoot(),DriverModule,DriverAuthModule,VehicleModule,
  CronModule, FinanceModule, RoutesModule,CommonModule], 
  controllers: [AppController],
  providers: [AppService, FinanceCronService, GoogleMapsService,AppGateway,],
})
export class AppModule {}
