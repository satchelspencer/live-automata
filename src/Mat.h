#include <nan.h>
#include <opencv2/core.hpp>

class Mat : public Nan::ObjectWrap
{
  public:
   cv::Mat * mat;
  static NAN_MODULE_INIT(Init);
  static NAN_METHOD(New);
  static NAN_METHOD(Roi);
  static NAN_METHOD(CopyTo);
  static Nan::Persistent<v8::FunctionTemplate> constructor;

};
