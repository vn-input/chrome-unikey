#include <emscripten/bind.h>
#include <unikey.h>

#include <codecvt>
#include <locale>

using namespace emscripten;
using namespace unikey;

class _EM_SimpleUnikey : public SimpleUnikey {
public:
  void reset() { SimpleUnikey::reset(); }
  void process(unsigned char c) { return SimpleUnikey::process(c); }
  void process(std::string const& str) { return SimpleUnikey::process(str); }
  void process_backspace() { SimpleUnikey::process_backspace(); }
  void restore() { SimpleUnikey::restore(); }
  void set_input_method(const InputMethod im) { SimpleUnikey::set_input_method(im); }
  void set_options(const Options& opt) { SimpleUnikey::set_options(opt); }

  std::wstring get_result() {
    const std::string& result = SimpleUnikey::get_result();
    return std::wstring_convert<std::codecvt_utf8_utf16<wchar_t>>{}.from_bytes(result);
  }
};

EMSCRIPTEN_BINDINGS(simple_unikey) {
  class_<_EM_SimpleUnikey>("SimpleUnikey")
    .constructor<>()
    .function("process_char", select_overload<void(unsigned char)>(&_EM_SimpleUnikey::process))
    .function("process", select_overload<void(const std::string&)>(&_EM_SimpleUnikey::process))
    .function("process_backspace", &_EM_SimpleUnikey::process_backspace)
    .function("get_result", &_EM_SimpleUnikey::get_result)
    .function("restore", &_EM_SimpleUnikey::restore)
    .function("reset", &_EM_SimpleUnikey::reset)
    .function("set_input_method", &_EM_SimpleUnikey::set_input_method)
    .function("set_options", &_EM_SimpleUnikey::set_options)
    ;
  enum_<SimpleUnikey::InputMethod>("InputMethod")
    .value("TELEX", SimpleUnikey::InputMethod::TELEX)
    .value("TELEX_SIMPLE", SimpleUnikey::InputMethod::TELEX_SIMPLE)
    .value("VNI", SimpleUnikey::InputMethod::VNI)
    ;
  value_object<Options>("UnikeyOptions")
    .field("modern_style", &Options::modern_style)
    .field("auto_restore_non_vn", &Options::auto_restore_non_vn)
    .field("spellcheck", &Options::spellcheck)
    ;
}
