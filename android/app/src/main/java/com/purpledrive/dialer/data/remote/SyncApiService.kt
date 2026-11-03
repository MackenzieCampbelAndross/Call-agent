package com.purpledrive.dialer.data.remote

import android.content.Context
import com.purpledrive.dialer.data.local.AuthPreferences
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

data class LoginRequest(
    val identifier: String,
    val password: String
)

data class SendOtpRequest(
    val email: String
)

data class SendOtpResponse(
    val success: Boolean,
    val message: String?,
    val error: String?,
    val devOtp: String?
)

data class VerifyOtpRequest(
    val email: String,
    val otp: String
)

data class LoginEmployeeData(
    val id: String,
    val employeeId: String,
    val name: String,
    val email: String,
    val department: String,
    val registeredPhoneNumber: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val error: String?,
    val user: LoginEmployeeData?,
    val employee: LoginEmployeeData?
)

interface SyncApiService {

    @POST("api/auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): Response<SendOtpResponse>

    @POST("api/auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<LoginResponse>

    @POST("api/auth/employee-login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/calls/sync")
    suspend fun syncCalls(@Body payload: SyncPayload): Response<SyncResponse>

    companion object {
        // Default points to localhost (10.0.2.2 for Android Emulator, or LAN IP for physical device)
        private const val DEFAULT_BASE_URL = "http://10.0.2.2:3001/"

        fun create(context: Context, baseUrl: String = DEFAULT_BASE_URL): SyncApiService {
            val authPrefs = AuthPreferences(context)

            val authInterceptor = Interceptor { chain ->
                val original = chain.request()
                val builder = original.newBuilder()

                val token = authPrefs.authToken
                if (!token.isNullOrBlank()) {
                    builder.header("Authorization", "Bearer $token")
                }

                chain.proceed(builder.build())
            }

            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(logging)
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .build()

            return Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(SyncApiService::class.java)
        }
    }
}
