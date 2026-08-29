import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
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
  final _picker = ImagePicker();

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
  String _vehicleType = 'bike';

  // Document photo base64 strings
  String? _dlPhotoBase64;
  String? _rcPhotoBase64;
  String? _aadhaarPhotoBase64;
  String? _panPhotoBase64;
  String? _vehiclePhotoBase64;

  final _pages = ['ব্যক্তিগত তথ্য', 'পরিচয় ও নথি', 'গাড়ির তথ্য ও ছবি', 'পেমেন্ট ও ব্যাংক'];

  // Format validation helpers
  bool get _isAadhaarValid => RegExp(r'^\d{12}$').hasMatch(_aadhaarCtrl.text.replaceAll(RegExp(r'\s'), ''));
  bool get _isPanValid => RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$').hasMatch(_panCtrl.text.trim().toUpperCase());
  bool get _isDlValid => RegExp(r'^[A-Z]{2}[0-9A-Z\s/-]{8,20}$').hasMatch(_dlCtrl.text.trim().toUpperCase());
  bool get _isRcValid => RegExp(r'^[A-Z]{2}[0-9A-Z\s/-]{6,15}$').hasMatch(_rcCtrl.text.trim().toUpperCase());

  Future<void> _pickDocumentImage(String type) async {
    try {
      final picked = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      if (picked != null) {
        final bytes = await File(picked.path).readAsBytes();
        final base64String = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        setState(() {
          if (type == 'dl') _dlPhotoBase64 = base64String;
          if (type == 'rc') _rcPhotoBase64 = base64String;
          if (type == 'aadhaar') _aadhaarPhotoBase64 = base64String;
          if (type == 'pan') _panPhotoBase64 = base64String;
          if (type == 'vehicle') _vehiclePhotoBase64 = base64String;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✓ ডকুমেন্টের ছবি সফলভাবে যুক্ত হয়েছে'), backgroundColor: Color(0xFF10B981)),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('ছবি নির্বাচন ব্যর্থ: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

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
        'dlNumber': _dlCtrl.text.trim().toUpperCase(),
        'rcNumber': _rcCtrl.text.trim().toUpperCase(),
        'vehicleMake': _vehicleMakeCtrl.text.trim(),
        'vehicleModel': _vehicleModelCtrl.text.trim(),
        'vehicleColor': _vehicleColorCtrl.text.trim(),
        'vehicleType': _vehicleType,
        'upiId': _upiCtrl.text.trim(),
        // Document photos
        'dlPhotoUrl': _dlPhotoBase64,
        'rcPhotoUrl': _rcPhotoBase64,
        'aadhaarPhotoUrl': _aadhaarPhotoBase64,
        'panPhotoUrl': _panPhotoBase64,
        'vehiclePhotoUrl': _vehiclePhotoBase64,
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
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('চালক নথি ও KYC নিবন্ধন'),
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Progress bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
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
                const SizedBox(height: 10),
                Text(
                  'ধাপ ${_page + 1}/${_pages.length}: ${_pages[_page]}',
                  style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13, fontWeight: FontWeight.bold),
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
          // Bottom Navigation Buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
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
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF22D3EE),
                      foregroundColor: const Color(0xFF0F172A),
                      minimumSize: const Size(double.infinity, 54),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _loading
                        ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Color(0xFF0F172A), strokeWidth: 2.5))
                        : Text(
                            _page == _pages.length - 1 ? 'জমা দিন (Submit KYC)' : 'পরবর্তী ধাপ',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(
    String label, 
    TextEditingController ctrl, {
    TextInputType? type, 
    String? hint, 
    bool upper = false,
    bool? isValid,
    String? validationMsg,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: ctrl,
            keyboardType: type,
            textCapitalization: upper ? TextCapitalization.characters : TextCapitalization.none,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: label,
              labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
              hintText: hint,
              hintStyle: const TextStyle(color: Colors.white24),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF22D3EE), width: 1.5)),
              suffixIcon: isValid != null && ctrl.text.isNotEmpty
                  ? Icon(isValid ? Icons.check_circle : Icons.error_outline, color: isValid ? const Color(0xFF10B981) : Colors.amber)
                  : null,
            ),
          ),
          if (ctrl.text.isNotEmpty && validationMsg != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(isValid == true ? Icons.check : Icons.info_outline, size: 13, color: isValid == true ? const Color(0xFF10B981) : Colors.amber),
                const SizedBox(width: 4),
                Text(validationMsg, style: TextStyle(color: isValid == true ? const Color(0xFF10B981) : Colors.amber, fontSize: 11)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _docPhotoUploadTile({
    required String title,
    required String subtitle,
    required String? photoBase64,
    required VoidCallback onPick,
    required VoidCallback onRemove,
  }) {
    final hasPhoto = photoBase64 != null;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: hasPhoto ? const Color(0xFF10B981) : const Color(0xFF334155)),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: hasPhoto ? const Color(0xFF10B981).withOpacity(0.15) : const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: hasPhoto ? const Color(0xFF10B981) : const Color(0xFF475569)),
            ),
            child: Icon(
              hasPhoto ? Icons.check_circle : Icons.camera_alt_outlined,
              color: hasPhoto ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 2),
                Text(
                  hasPhoto ? '✓ ছবি সংযুক্ত হয়েছে' : subtitle,
                  style: TextStyle(color: hasPhoto ? const Color(0xFF10B981) : const Color(0xFF94A3B8), fontSize: 11),
                ),
              ],
            ),
          ),
          if (hasPhoto)
            IconButton(
              icon: const Icon(Icons.close, color: Colors.redAccent, size: 20),
              onPressed: onRemove,
            )
          else
            TextButton.icon(
              onPressed: onPick,
              icon: const Icon(Icons.add_a_photo, size: 15),
              label: const Text('ছবি তুলুন', style: TextStyle(fontSize: 12)),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF22D3EE),
                backgroundColor: const Color(0xFF22D3EE).withOpacity(0.1),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPage1() => SingleChildScrollView(
    padding: const EdgeInsets.all(20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('ব্যক্তিগত তথ্য লিখুন', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text('সরকারি পরিচয়পত্র অনুযায়ী আপনার সঠিক নাম লিখুন', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 18),
        _field('আপনার পুরো নাম', _nameCtrl, hint: 'যেমন আধারে আছে'),
      ],
    ),
  );

  Widget _buildPage2() => SingleChildScrollView(
    padding: const EdgeInsets.all(20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('পরিচয় নথি ও ডকুমেন্টের ছবি', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text('আধার, প্যান ও ড্রাইভিং লাইসেন্স নম্বর ও ছবি সংযুক্ত করুন', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 18),

        // DL Field & Photo
        _field(
          'ড্রাইভিং লাইসেন্স নম্বর (DL)', 
          _dlCtrl, 
          upper: true, 
          hint: 'যেমন WB73 20210000433',
          isValid: _isDlValid,
          validationMsg: _isDlValid ? '✓ ড্রাইভিং লাইসেন্স ফরম্যাট সঠিক' : 'সঠিক DL নম্বর লিখুন (যেমন WB73 20210000433)',
        ),
        _docPhotoUploadTile(
          title: 'ড্রাইভিং লাইসেন্স ছবি',
          subtitle: 'লাইসেন্সের সামনের অংশের স্পষ্ট ছবি',
          photoBase64: _dlPhotoBase64,
          onPick: () => _pickDocumentImage('dl'),
          onRemove: () => setState(() => _dlPhotoBase64 = null),
        ),
        const SizedBox(height: 10),

        // Aadhaar Field & Photo
        _field(
          'আধার কার্ড নম্বর', 
          _aadhaarCtrl, 
          type: TextInputType.number, 
          hint: '১২ সংখ্যার আধার নম্বর',
          isValid: _isAadhaarValid,
          validationMsg: _isAadhaarValid ? '✓ ১২ সংখ্যার আধার নম্বর সঠিক' : '১২ সংখ্যার সঠিক আধার নম্বর লিখুন',
        ),
        _docPhotoUploadTile(
          title: 'আধার কার্ড ছবি',
          subtitle: 'আধার কার্ডের সামনের স্পষ্ট ছবি',
          photoBase64: _aadhaarPhotoBase64,
          onPick: () => _pickDocumentImage('aadhaar'),
          onRemove: () => setState(() => _aadhaarPhotoBase64 = null),
        ),
        const SizedBox(height: 10),

        // PAN Field & Photo
        _field(
          'PAN কার্ড নম্বর', 
          _panCtrl, 
          hint: 'যেমন PJJPS9007N', 
          upper: true,
          isValid: _isPanValid,
          validationMsg: _isPanValid ? '✓ PAN কার্ড ফরম্যাট সঠিক' : '১০ অক্ষরের PAN নম্বর (যেমন ABCDE1234F)',
        ),
        _docPhotoUploadTile(
          title: 'PAN কার্ড ছবি',
          subtitle: 'প্যান কার্ডের স্পষ্ট ছবি',
          photoBase64: _panPhotoBase64,
          onPick: () => _pickDocumentImage('pan'),
          onRemove: () => setState(() => _panPhotoBase64 = null),
        ),
      ],
    ),
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
        _field(
          'গাড়ির RC নম্বর (Registration Number)', 
          _rcCtrl, 
          upper: true, 
          hint: 'যেমন WB74AR4274',
          isValid: _isRcValid,
          validationMsg: _isRcValid ? '✓ RC নম্বর ফরম্যাট সঠিক' : 'গাড়ির নাম্বার প্লেট অনুযায়ী নম্বর লিখুন',
        ),
        _docPhotoUploadTile(
          title: 'গাড়ির RC বইয়ের ছবি',
          subtitle: 'গাড়ির ব্লু বুক বা স্মার্ট কার্ড RC এর ছবি',
          photoBase64: _rcPhotoBase64,
          onPick: () => _pickDocumentImage('rc'),
          onRemove: () => setState(() => _rcPhotoBase64 = null),
        ),
        const SizedBox(height: 8),
        _field('গাড়ির কোম্পানি (Make)', _vehicleMakeCtrl, hint: 'যেমন Hero / Maruti'),
        _field('গাড়ির মডেল (Model)', _vehicleModelCtrl, hint: 'যেমন Glamour / Dzire'),
        _field('গাড়ির রং (Color)', _vehicleColorCtrl, hint: 'যেমন নীল / সাদা'),
        const SizedBox(height: 8),
        _docPhotoUploadTile(
          title: 'গাড়ির আসল ছবি',
          subtitle: 'নাম্বার প্লেট সহ গাড়ির সামনের ছবি',
          photoBase64: _vehiclePhotoBase64,
          onPick: () => _pickDocumentImage('vehicle'),
          onRemove: () => setState(() => _vehiclePhotoBase64 = null),
        ),
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
            Expanded(child: Text('আপনার রাইডের আয় সরাসরি এই UPI নম্বরে তাৎক্ষণিক জমা হবে', style: TextStyle(color: Colors.white70, fontSize: 13))),
          ]),
        ),
        const SizedBox(height: 20),
        _field('UPI ID', _upiCtrl, hint: 'যেমন 7584864899@upi বা মোবাইল নম্বর'),
      ],
    ),
  );
}
