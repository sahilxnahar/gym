"""Original schematic movement diagrams. No third-party media or anatomy assets.
These illustrate patterns, not personalized form assessment or full technique.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
from math import cos, pi
ROOT=Path(__file__).resolve().parents[1]/'public'/'demos';ROOT.mkdir(parents=True,exist_ok=True)
S=2
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(font_path,14*S);bold=ImageFont.truetype(font_path,22*S)
names={'squat':'Squat pattern','pushup':'Push-up pattern','row':'Dumbbell row pattern','hinge':'Hip-hinge pattern','bridge':'Glute bridge','deadbug':'Dead bug'}
def lerp(a,b,t):return tuple(a[i]+(b[i]-a[i])*t for i in range(2))
def make(key,t):
 im=Image.new('RGB',(512*S,400*S),'#111b15');d=ImageDraw.Draw(im)
 def line(a,b,color='#d4f85a',width=10):d.line(tuple(round(v*S) for v in (*a,*b)),fill=color,width=width*S)
 def circle(p,r,fill):x,y=p;d.ellipse(((x-r)*S,(y-r)*S,(x+r)*S,(y+r)*S),fill=fill)
 def person(head,shoulder,hip,arms,legs):
  circle(head,18,'#d4f85a');line((head[0],head[1]+15),shoulder,width=7);line(shoulder,hip,width=12)
  for joint,end in arms:line(shoulder,joint,width=8);line(joint,end,width=8);circle(joint,5,'#8caa40')
  for knee,foot in legs:line(hip,knee,width=10);line(knee,foot,width=9);circle(knee,6,'#8caa40');line(foot,(foot[0]+20,foot[1]),width=8)
  circle(hip,7,'#edf8cc')
 d.text((28*S,22*S),'FORGE / MOVEMENT GUIDE',fill='#94a68b',font=font)
 d.text((28*S,49*S),names[key],fill='#f5f6f1',font=bold)
 line((50,350),(462,350),'#344238',2)
 if key=='squat':
  head=lerp((243,108),(210,170),t);shoulder=lerp((240,140),(218,204),t);hip=lerp((240,225),(242,272),t);knee=lerp((253,287),(312,285),t);foot=(271,342)
  person(head,shoulder,hip,[(lerp((220,179),(185,209),t),lerp((198,217),(141,209),t))],[(knee,foot)])
 elif key=='pushup':
  sh=lerp((149,181),(149,259),t);hip=lerp((273,237),(273,276),t);head=lerp((112,166),(112,249),t);el=lerp((153,246),(110,271),t)
  person(head,sh,hip,[(el,(155,335))],[((337,290),(407,335))])
 elif key=='row':
  sh=(226,185);hand=lerp((205,301),(264,236),t);el=lerp((212,245),(289,185),t)
  person((190,162),sh,(325,244),[(el,hand)],[((346,298),(318,343)),((286,299),(267,343))]);line((hand[0]-16,hand[1]),(hand[0]+16,hand[1]),'#d3ded0',8);line((hand[0]-20,hand[1]-10),(hand[0]-20,hand[1]+10),'#d4f85a',10);line((hand[0]+20,hand[1]-10),(hand[0]+20,hand[1]+10),'#d4f85a',10)
 elif key=='hinge':
  hip=lerp((266,238),(314,244),t);sh=lerp((266,145),(209,191),t);head=lerp((266,108),(175,169),t)
  person(head,sh,hip,[(lerp((256,199),(208,244),t),lerp((253,262),(208,304),t))],[(lerp((282,287),(294,291),t),(279,343))])
 elif key=='bridge':
  person((108,310),(150,313),lerp((255,315),(255,248),t),[((196,331),(238,332))],[((335,237),(391,335))]);line((80,341),(420,341),'#607459',4)
 elif key=='deadbug':
  person((127,312),(164,314),(270,314),[(lerp((165,252),(132,307),t),lerp((154,204),(93,297),t)),((187,258),(197,209))],[(lerp((302,246),(354,293),t),lerp((365,242),(423,322),t)),((268,246),(213,246))]);line((85,342),(433,342),'#607459',4)
 d.text((28*S,373*S),'SCHEMATIC · CONTROLLED RANGE · NO FORM ASSESSMENT',fill='#94a68b',font=ImageFont.truetype(font_path,10*S))
 return im.resize((512,400),Image.Resampling.LANCZOS)
for key in names:
 frames=[make(key,(1-cos(2*pi*i/32))/2) for i in range(32)]
 frames[0].save(ROOT/f'{key}.png')
 frames[0].save(ROOT/f'{key}.gif',save_all=True,append_images=frames[1:],duration=90,loop=0,optimize=False,disposal=2)
print('Created six original GIF guides and stills.')
