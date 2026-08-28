import 'package:flutter/material.dart';
import '../services/api_service.dart';

class KycOnboardingScreen extends StatefulWidget {
  const KycOnboardingScreen({super.key});
  @override
  State<KycOnboardingScreen> createState() => _KycOnboardingScreenState();
}

class _KycOnboardingScreenState extends State<KycOnboardingScreen> {
  final _pageCtrl = PageController();
  int _page = 0;
  bool _loading = false;

  // Controllers for all KYC fields
  final _nameCtrl = TextEditingController();
  final _aadhaarCtrl = TextEditingController();
  final _panCtrl = TextEditingController();
  final _dlCtrl = TextEditingController();
  final _rcCtrl = TextEditingController();
  final _vehicleMakeCtrl = TextEditingController();
  final _vehicleModelCtrl = TextEditingController();
  final _vehicleColorCtrl = TextEditingController();
  final _upiCtrl = TextEditingController();
  String _vehicleType = 'sedan';

  final _pages = ['ব্যক্তিগত তথ্য', 'পরিচয় নথি', 'গাড়ির তথ্য', 'পেমেন্ট তথ্য'];

  void _next() {
    if (_page < _pages.length - 1) {
      _pageCtrl.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      setState(() => _page++);
    } else {
      _submit();
    }
  }

  void _back() {
    if (_page > 0) {
      _pageCtrl.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      setState(() => _page--);
    }
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      // Update name first
      if (_nameCtrl.text.isNotEmpty) {
        await ApiService.updateProfile(name: _nameCtrl.text.trim());
      }
      await ApiService.submitKyc({
        'aadhaarNumber': _aadhaarCtrl.text.trim(),
        'panNumber': _panCtrl.text.trim().toUpperCase(),
        'dlNumber': _dlCtrl.text.trim(),
        'rcNumber': _rcCtrl.text.trim(),
        'vehicleMake': _vehicleMakeCtrl.text.trim(),
        'vehicleModel': _vehicleModelCtrl.text.trim(),
        'vehicleColor': _vehicleColorCtrl.text.trim(),
        'vehicleType': _vehicleType,
        'upiId': _upiCtrl.text.trim(),
      });
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/kyc-pending');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('সমস্যা হয়েছে: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    for (final c in [_nameCtrl, _aadhaarCtrl, _panCtrl, _dlCtrl, _rcCtrl, _vehicleMakeCtrl, _vehicleModelCtrl, _vehicleColorCtrl, _upiCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('KYC নিবন্ধন')),
      body: Column(
        children: [
          // Progress bar
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(_pages.length, (i) => Expanded(
                    child: Container(
                      height: 4,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: i <= _page ? const Color(0xFF22D3EE) : const Color(0xFF334155),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  )),
                ),
                const SizedBox(height: 12),
                Text(
                  'ধাপ ${_page + 1}/${_pages.length}: ${_pages[_page]}',
                  style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13),
                ),
              ],
            ),
          ),
          // Pages
          Expanded(
            child: PageView(
              controller: _pageCtrl,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildPage1(),
                _buildPage2(),
                _buildPage3(),
                _buildPage4(),
              ],
            ),
          ),
          // Buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
            child: Row(
              children: [
                if (_page > 0) ...[
                  OutlinedButton(
                    onPressed: _back,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFF334155)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      minimumSize: const Size(80, 54),
                    ),
                    child: const Text('পেছনে'),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: ElevatedButton(
                    onPressed: _loading ? null : _next,
                    child: _loading
                        ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Color(0xFF0F172A), strokeWidth: 2.5))
                        : Text(_page == _pages.length - 1 ? 'জমা দিন' : 'পরবর্তী'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, {TextInputType? type, String? hint, bool upper = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: ctrl,
        keyboardType: type,
        textCapitalization: upper ? TextCapitalization.characters : TextCapitalization.none,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(labelText: label, hintText: hint, hintStyle: TextStyle(color: Colors.white24)),
      ),
    );
  }

  Widget _buildPage1() => SingleChildScrollView(
    padding: const EdgeInsets.all(20),
    child: Column(children: [
      _field('আপনার পুরো নাম', _nameCtrl, hint: 'যেমন আধারে আছে'),
    ]),
  );

  Widget _buildPage2() => SingleChildScrollView(
    padding: const EdgeInsets.all(20),
    child: Column(children: [
      _field('আধার নম্বর', _aadhaarCtrl, type: TextInputType.number, hint: '12 সংখ্যার'),
      _field('PAN নম্বর', _panCtrl, hint: 'যেমন ABCDE1234F', upper: true),
      _field('ড্রাইভিং লাইসেন্স নম্বর', _dlCtrl, upper: true),
    ]),
  );

  Widget _buildPage3() => SingleChildScrollView(
    padding: const EdgeInsets.all(20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('গাড়ির ধরন', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 10, runSpacing: 10,
          children: [
            {'id': 'bike', 'icon': '🏍️', 'name': 'বাইক'},
            {'id': 'auto', 'icon': '🛺', 'name': 'অটো'},
            {'id': 'sedan', 'icon': '🚗', 'name': 'সেডান'},
            {'id': 'suv', 'icon': '🚙', 'name': 'SUV'},
            {'id': 'ev', 'icon': '⚡', 'name': 'EV'},
          ].map((v) {
            final selected = _vehicleType == v['id'];
            return GestureDetector(
              onTap: () => setState(() => _vehicleType = v['id'] as String),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? const Color(0xFF22D3EE).withOpacity(0.1) : const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: selected ? const Color(0xFF22D3EE) : const Color(0xFF334155)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text(v['icon'] as String, style: const TextStyle(fontSize: 18)),
                  const SizedBox(width: 6),
                  Text(v['name'] as String, style: TextStyle(color: selected ? const Color(0xFF22D3EE) : Colors.white, fontWeight: FontWeight.w600)),
                ]),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        _field('RC নম্বর', _rcCtrl, upper: true, hint: 'যেমন WB01AB1234'),
        _field('গাড়ির প্রস্তুতকারক', _vehicleMakeCtrl, hint: 'যেমন Maruti Suzuki'),
        _field('মডেল', _vehicleModelCtrl, hint: 'যেমন Swift Dzire'),
        _field('রং', _vehicleColorCtrl, hint: 'যেমন সাদা'),
      ],
    ),
  );

  Widget _buildPage4() => SingleChildScrollView(
    padding: const EdgeInsets.all(20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF22D3EE).withOpacity(0.05),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF22D3EE).withOpacity(0.2)),
          ),
          child: const Row(children: [
            Text('💳', style: TextStyle(fontSize: 24)),
            SizedBox(width: 10),
            Expanded(child: Text('আপনার আয় সরাসরি এই UPI নম্বরে পাঠানো হবে', style: TextStyle(color: Colors.white70, fontSize: 13))),
          ]),
        ),
        const SizedBox(height: 20),
        _field('UPI ID', _upiCtrl, hint: 'যেমন 9876543210@upi'),
      ],
    ),
  );
}
