import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../widgets/server_settings_dialog.dart';

class PhoneInputScreen extends StatefulWidget {
  const PhoneInputScreen({super.key});

  @override
  State<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends State<PhoneInputScreen> {
  final _phoneController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) {
      setState(() => _error = 'সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন');
      return;
    }
    setState(() { _isLoading = true; _error = null; });
    try {
      final fullPhone = '+91$phone';
      final result = await ApiService.sendOtp(fullPhone, role: 'rider');
      if (!mounted) return;
      Navigator.pushNamed(context, '/otp', arguments: {
        'phone': fullPhone,
        'role': 'rider',
        'devOtp': result['dev_otp'],
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      final currentUrl = await ApiService.getBaseUrl();
      setState(() => _error = 'সার্ভার সংযোগ ব্যর্থ ($currentUrl)। উপরের ⚙️ আইকন থেকে সার্ভার আইপি ঠিক আছে কিনা যাচাই করুন।');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF6C3DF4)),
            tooltip: 'সার্ভার সংযোগ কনফিগারেশন',
            onPressed: () => ServerSettingsDialog.show(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6C3DF4), Color(0xFF3B82F6)],
                  ),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Center(child: Text('🚗', style: TextStyle(fontSize: 32))),
              ),
              const SizedBox(height: 28),
              Text(
                'আপনার মোবাইল নম্বর লিখুন',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1A1A2E),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'আপনার নম্বরে একটি OTP পাঠানো হবে',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 36),
              // Phone field
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                ],
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, letterSpacing: 2),
                decoration: InputDecoration(
                  labelText: 'মোবাইল নম্বর',
                  prefixIcon: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🇮🇳', style: TextStyle(fontSize: 20)),
                        const SizedBox(width: 6),
                        Text('+91', style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[700],
                        )),
                        const SizedBox(width: 6),
                        Container(
                          height: 20,
                          width: 1,
                          color: Colors.grey[300],
                        ),
                      ],
                    ),
                  ),
                  errorText: _error,
                  errorMaxLines: 3,
                ),
                onChanged: (_) => setState(() => _error = null),
                onFieldSubmitted: (_) => _sendOtp(),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _sendOtp,
                child: _isLoading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : const Text('OTP পাঠান'),
              ),
              const SizedBox(height: 32),
              // Co-op badge
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F7FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E0FF)),
                ),
                child: Row(
                  children: [
                    const Text('🤝', style: TextStyle(fontSize: 24)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'চালাও সমবায়ে স্বাগতম',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          Text(
                            'মাত্র ৮-১০% প্ল্যাটফর্ম ফি। বাকি সব ড্রাইভার ও যাত্রীদের।',
                            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
