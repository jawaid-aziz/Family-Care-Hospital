import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { useToast } from "@/Components/ui/use-toast";
const API_URL = import.meta.env.VITE_API_URL;

const inHouseTests = [
  "CBC (Complete Blood Count) Basic Hematology",
  "Blood Sugar Random/Fasting",
  "HBsAg screening",
  "Anti HCV (Screening, ICT)",
  "Anti HIV - 1 & 2",
  "Hemoglobin",
  "Blood Group",
];

const outSourceTests = [
  "ICT malaria",
  "LFTs",
  "RFTs",
  "Blood Urea",
  "ALT",
  "Serum Creatinine",
  "AST",
  "ALP",
  "Serum Uric Acid",
  "VDRL (Syphilis)",
];

export const ShowLab = () => {
  const [appointment, setAppointment] = useState(null);
  const [labResults, setLabResults] = useState({});
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [labCollectionDate, setLabCollectionDate] = useState(null);
  const [labReportedDate, setLabReportedDate] = useState(null);
  const { toast } = useToast(); 
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}appointments/${id}`);
        const data = await res.json();

        if (res.ok) {
          setLoading(false);
          setAppointment(data.data);
        } else {
          setLoading(false);
          toast({
            title: "Error",
            description: data.message || "Failed to fetch appointment data.",
            variant: "destructive",
          });
        }
      } catch (err) {
        setLoading(false);
        toast({
          title: "Error",
          description: "Error fetching appointment data",
          variant: "destructive",
        });
        console.error(err);
      }
    };

    if (id) fetchAppointment();
  }, [id]);

  // handle input change for in-house lab results
  const handleInputChange = (test, value) => {
    setLabResults((prev) => ({
      ...prev,
      [test]: value,
    }));
  };

  if (!appointment) return <p className="p-4 text-gray-500">Loading...</p>;

  const isInHouse = appointment.labLocation?.toLowerCase() === "inhouse";

  const showPositiveNegative = (test) => {
    return (
      test !== "CBC (Complete Blood Count) Basic Hematology" &&
      test !== "Blood Group"
    );
  };

  const handleGenerateLabReport = async () => {
    setLoading(true);
    if (!appointment) {
      toast({
        title: "Error",
        description: "Appointment data is missing",
      });
      return;
    }

    const qrLink = `${API_URL}appointments/openLabReport/${encodeURIComponent(
      appointment.mrn
    )}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrLink, {
      width: 100,
      margin: 1,
    });

    const headerHTML = `
    <div style="position: relative; text-align:center; border-bottom:2px solid #000; padding-bottom:6px;">
          <!-- ✅ QR Code in top-right -->
      <img src="${qrCodeDataURL}" alt="QR Code" style="position: absolute; top: 0; right: 0; width: 80px; height: 80px;" />

      <h1 style="margin:0; font-size:18pt; font-weight:bold; color:#1a1a1a;">Family Care Hospital</h1>
      <h2 style="margin:5px 0 0 0; font-size:13pt; font-weight:bold; color:#b30000; text-transform:uppercase; white-space:pre;">Clinical Laboratory</h2>
      <p style="margin:5px 0 0 0; font-style:italic; font-size:9pt;">"Determined to serve humanity"</p>
    </div>
    <div style="margin-top:8px; display:grid; grid-template-columns:repeat(2,1fr); font-size:9pt; white-space:pre-wrap; border-bottom: 1px solid #000; padding-bottom: 8px;">
      <p><strong>MRN: </strong> ${appointment.mrn}</p>
      <p><strong>Collection Date: </strong> ${
        labCollectionDate
          ? format(labCollectionDate, "PPP p")
          : new Date().toLocaleDateString()
      }</p>
      <p><strong>Patient Name: </strong> ${appointment.name}</p>
      <p><strong>Reported Date: </strong> ${
        labReportedDate
          ? format(labReportedDate, "PPP p")
          : new Date().toLocaleDateString()
      }</p>
      <p><strong>Father's Name: </strong> ${appointment.fatherName}</p>
      <p><strong>Location: </strong> ${appointment.labLocated}</p>
      <p><strong>Age/Sex: </strong> ${appointment.age || "-"} / ${
      appointment.sex || "-"
    }</p>
      <p><strong>Referred by: </strong> ${
        appointment.doctor === "paediatrics"
          ? "Dr. Ejaz Mazari"
          : appointment.doctor === "gynae"
          ? "Dr. Salma Ejaz"
          : appointment.doctor || "-"
      }</p>
      <p><strong>Phone: </strong> ${appointment.phone || "-"}</p>
      <p><strong>Consultant: </strong> ${" "}</p>
      <p><strong>CNIC: </strong> ${appointment.cnic || "-"}</p>
      <p><strong>Collection Type: </strong> ${
        appointment.labLocation === "InHouse" ? "Taken in Lab" : "-"
      }</p>
      <p><strong>Address: </strong> ${appointment.address || "-"}</p>
    </div>
  `;

    const footerHTML = `
    <div style="margin-top:auto; border-top:2px solid #000; padding-top:10px; text-align:center; font-size:9pt;">
      <div style="display:flex; justify-content:space-around; flex-wrap:wrap; gap:10px;">
        <div><strong>Dr. Ejaz Mazari</strong><br/>MBBS, FCPS<br/><em>Child Specialist</em></div>
        <div><strong>Dr. Salma Ejaz</strong><br/>MBBS</div>
        <div><strong>Sadaf Raheem</strong><br/><em>Lab Technologist</em></div>
      </div>
      <hr style="margin:10px auto; width:75%; border:0; border-top:1px solid #888;" />
      <p style="margin:3px 0;">📞 <strong>0333-6438402</strong></p>
      <p style="margin:2px 0;">🏥 Qutub Canal Link Road, Rajanpur</p>
    </div>
  `;

    // ✅ Separate tests
    const cbcAvailable = appointment.labs.includes(
      "CBC (Complete Blood Count) Basic Hematology"
    );
    const inHouse = appointment.labs.filter((t) => inHouseTests.includes(t));
    const outsource = appointment.labs.filter((t) =>
      outSourceTests.includes(t)
    );

    // ✅ CBC table (only if available)
    const cbcHTML = cbcAvailable
      ? `
    <div style="margin-bottom:20px;">
      <h3 style="margin:0; font-size:12pt; font-weight:bold; text-decoration:underline; white-space:pre;">CBC (Complete Blood Count)</h3>
      <table style="width:100%; border-collapse:collapse; margin-top:8px; font-size:9pt;">
        <thead>
          <tr style="background-color:#f5f5f5;">
            <th style="border:1px solid #000; padding:5px;">Test</th>
            <th style="border:1px solid #000; padding:5px;">Result</th>
            <th style="border:1px solid #000; padding:5px;">Normal Range</th>
            <th style="border:1px solid #000; padding:5px;">Unit</th>
          </tr>
        </thead>
        <tbody>
          ${[
            { name: "HB", range: "11.5 - 14.5", unit: "g/dl" },
            { name: "Total RBC", range: "4 - 6", unit: "x10^12/l" },
            { name: "HCT", range: "32 - 46", unit: "%" },
            { name: "MCV", range: "75 - 85", unit: "fl" },
            { name: "MCH", range: "26 - 32", unit: "pg" },
            { name: "MCHC", range: "30 - 35", unit: "g/dl" },
            { name: "Platelets", range: "140 - 450", unit: "x10^3/µL" },
            { name: "WBC", range: "6 - 13", unit: "10^3/µl" },
            { name: "Neutrophils", range: "20 - 75", unit: "%" },
            { name: "Lymphocytes", range: "30 - 75", unit: "%" },
            { name: "Eosinophils", range: "1 - 5", unit: "%" },
            { name: "Monocytes", range: "2 - 6", unit: "%" },
          ]
            .map(
              (row) => `
            <tr>
              <td style="border:1px solid #000; padding:4px;">${row.name}</td>
              <td style="border:1px solid #000; padding:4px;">${
                labResults[row.name] || "-"
              }</td>
              <td style="border:1px solid #000; padding:4px;">${row.range}</td>
              <td style="border:1px solid #000; padding:4px;">${row.unit}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
      : "";

    // ✅ Other in-house tests (excluding CBC)
    const otherInHouse = inHouse
      .filter((t) => t !== "CBC (Complete Blood Count) Basic Hematology")
      .map((test) => {
        if (test === "Blood Group") {
          return `
          <div style="margin-bottom:15px;">
            <h3 style="margin:0; font-size:11pt; font-weight:bold; text-decoration:underline;">Blood Group</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:6px;">
              <tr>
                <th style="border:1px solid #000; padding:5px;">ABO Group</th>
                <th style="border:1px solid #000; padding:5px;">Rhesus (Rh)</th>
              </tr>
              <tr>
                <td style="border:1px solid #000; padding:5px;">${
                  labResults["ABO Group"] || "-"
                }</td>
                <td style="border:1px solid #000; padding:5px;">${
                  labResults["Rhesus"] || "-"
                }</td>
              </tr>
            </table>
          </div>
        `;
        }
        if (test === "Blood Sugar Random/Fasting") {
          return `
        <div style="margin-bottom:15px;">
          <h3 style="margin:0; font-size:11pt; font-weight:bold; text-decoration:underline;">${test}</h3>
          <p style="margin:4px 0;"><strong>Result:</strong> ${
            labResults[test] ? `${labResults[test]}mg/dL` : "-"
          }</p>
        </div>
      `;
        }
        if (test === "Hemoglobin") {
          return `
        <div style="margin-bottom:15px;">
          <h3 style="margin:0; font-size:11pt; font-weight:bold; text-decoration:underline;">${test}</h3>
          <p style="margin:4px 0;"><strong>Result:</strong> ${
            labResults[test] ? `${labResults[test]}g/dL` : "-"
          }</p>
        </div>
      `;
        }
        return `
        <div style="margin-bottom:15px;">
          <h3 style="margin:0; font-size:11pt; font-weight:bold; text-decoration:underline;">${test}</h3>
          <p style="margin:4px 0;"><strong>Result:</strong> ${
            labResults[test] || "-"
          }</p>
        </div>
      `;
      })
      .join("");

    // ✅ Outsource tests (only names)
    const outsourceHTML = outsource.length
      ? `
      <div style="margin-top:20px;">
        <h3 style="font-size:11pt; text-decoration:underline;">Outsourced Tests:</h3>
        <ul style="margin-top:6px; padding-left:20px; font-size:9pt;">
          ${outsource.map((t) => `<li>${t}</li>`).join("")}
        </ul>
      </div>
    `
      : "";

    // ✅ Determine layout
    const pageContent = cbcAvailable
      ? {
          page1: `${cbcHTML}`,
          page2: `${otherInHouse}${outsourceHTML}`,
        }
      : {
          page1: `${otherInHouse}${outsourceHTML}`,
        };

    // ✅ Construct container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.innerHTML = `
  <div style="width:700px; height:950px; display:flex; flex-direction:column; justify-content:space-between; padding:30px; box-sizing:border-box;">
    ${headerHTML}
    <div style="flex:1; display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-start;">
      <div style="width:100%;">${pageContent.page1}</div>
    </div>
    ${footerHTML}
  </div>
  ${
    pageContent.page2
      ? `
    <div style="page-break-before:always; width:700px; height:950px; display:flex; flex-direction:column; justify-content:space-between; padding:30px; box-sizing:border-box;">
      ${headerHTML}
      <div style="flex:1; display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-start;">
        <div style="width:100%;">${pageContent.page2}</div>
      </div>
      ${footerHTML}
    </div>`
      : ""
  }
`;

    document.body.appendChild(container);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pages = container.children;
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/jpeg");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, imgHeight);
      }

      const pdfBlob = new Blob([pdf.output("arraybuffer")], {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("mrn", appointment.mrn);
      formData.append("file", pdfBlob, `${appointment.mrn}.pdf`);

      const res = await fetch(`${API_URL}appointments/labReport`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setLoading(false);
        toast({
          title: "Success",
          description: "Lab Report saved on server successfully!",
          variant: "default",
        });
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, "_blank");
      } else {
        setLoading(false);
        toast({
          title: "Error",
          description: data.message || "Failed to save lab report.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to generate lab report",
        variant: "destructive",
      });
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleViewLab = async (mrn) => {
    try {
      setLoading(true);
      if (!mrn) {
        toast({
          title: "Error",
          description: "MRN is missing",
          variant: "destructive",
        });
        return;
      }

      // Open in new tab directly
      window.open(
        `${API_URL}appointments/openLabReport/${encodeURIComponent(mrn)}`,
        "_blank"
      );
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to open lab report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Lab Report Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-medium text-gray-700">MRN: {appointment.mrn}</p>
            <Badge
              variant={
                appointment.status === "Pending" ? "secondary" : "default"
              }
            >
              {appointment.status}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="font-semibold">Name:</span> {appointment.name}
              </p>
              <p>
                <span className="font-semibold">Age:</span> {appointment.age}
              </p>
              <p>
                <span className="font-semibold">Sex:</span> {appointment.sex}
              </p>
              <p>
                <span className="font-semibold">CNIC:</span> {appointment.cnic}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Doctor:</span>{" "}
                {appointment.doctor}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {appointment.phone}
              </p>
              <p>
                <span className="font-semibold">Address:</span>{" "}
                {appointment.address}
              </p>
              <p>
                <span className="font-semibold">Lab Type:</span>{" "}
                {appointment.labLocation}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="font-semibold text-gray-800 mb-2">
              Selected Lab Tests:
            </p>

            {appointment.labs && appointment.labs.length > 0 ? (
              <div className="space-y-4">
                {appointment.labs.map((test, index) => (
                  <Card key={index} className="p-3 border">
                    <CardContent className="p-0">
                      <div className="flex flex-col space-y-2">
                        <Label className="font-semibold">{test}</Label>

                        {isInHouse && inHouseTests.includes(test) ? (
                          test ===
                          "CBC (Complete Blood Count) Basic Hematology" ? (
                            // ✅ CBC TABLE
                            <div className="overflow-x-auto">
                              <Table className="border text-sm">
                                <thead>
                                  <tr className="bg-gray-100 font-semibold">
                                    <th className="p-2 text-left">Test</th>
                                    <th className="p-2 text-left">
                                      Normal Range
                                    </th>
                                    <th className="p-2 text-left">Unit</th>
                                    <th className="p-2 text-left">Result</th>
                                  </tr>
                                </thead>
                                <TableBody>
                                  {[
                                    {
                                      name: "HB",
                                      range: "11.5 - 14.5",
                                      unit: "g/dl",
                                    },
                                    {
                                      name: "Total RBC",
                                      range: "4 - 6",
                                      unit: "x10^12/l",
                                    },
                                    {
                                      name: "HCT",
                                      range: "32 - 46",
                                      unit: "%",
                                    },
                                    {
                                      name: "MCV",
                                      range: "75 - 85",
                                      unit: "fl",
                                    },
                                    {
                                      name: "MCH",
                                      range: "26 - 32",
                                      unit: "pg",
                                    },
                                    {
                                      name: "MCHC",
                                      range: "30 - 35",
                                      unit: "g/dl",
                                    },
                                    {
                                      name: "Platelets",
                                      range: "140 - 450",
                                      unit: "x10^3/µL",
                                    },
                                    {
                                      name: "WBC",
                                      range: "6 - 13",
                                      unit: "10^3/µl",
                                    },
                                    {
                                      name: "Neutrophils",
                                      range: "20 - 75",
                                      unit: "%",
                                    },
                                    {
                                      name: "Lymphocytes",
                                      range: "30 - 75",
                                      unit: "%",
                                    },
                                    {
                                      name: "Eosinophils",
                                      range: "1 - 5",
                                      unit: "%",
                                    },
                                    {
                                      name: "Monocytes",
                                      range: "2 - 6",
                                      unit: "%",
                                    },
                                  ].map((row) => (
                                    <TableRow key={row.name}>
                                      <TableCell className="font-medium">
                                        {row.name}
                                      </TableCell>
                                      <TableCell>{row.range}</TableCell>
                                      <TableCell>{row.unit}</TableCell>
                                      <TableCell>
                                        <Input
                                          type="text"
                                          placeholder="Enter result"
                                          value={labResults[row.name] || ""}
                                          onChange={(e) =>
                                            handleInputChange(
                                              row.name,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : test === "Blood Group" ? (
                            // ✅ BLOOD GROUP FIELDS
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex flex-col w-full">
                                  <Label>ABO Group</Label>
                                  <select
                                    className="border rounded-md p-2"
                                    value={labResults["ABO Group"] || ""}
                                    onChange={(e) =>
                                      handleInputChange(
                                        "ABO Group",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">Select</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="AB">AB</option>
                                    <option value="O">O</option>
                                  </select>
                                </div>

                                <div className="flex flex-col w-full">
                                  <Label>Rhesus (Rh)</Label>
                                  <select
                                    className="border rounded-md p-2"
                                    value={labResults["Rhesus"] || ""}
                                    onChange={(e) =>
                                      handleInputChange(
                                        "Rhesus",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">Select</option>
                                    <option value="Positive">
                                      Positive (+)
                                    </option>
                                    <option value="Negative">
                                      Negative (-)
                                    </option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ) : test === "Blood Sugar Random/Fasting" ? (
                            // ✅ BLOOD SUGAR FIELD (NUMERIC)
                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                              <Label>Result (mg/dL):</Label>
                              <Input
                                type="number"
                                placeholder="Enter blood sugar level"
                                value={labResults[test] || ""}
                                onChange={(e) =>
                                  handleInputChange(test, e.target.value)
                                }
                                className="w-60"
                              />
                            </div>
                          ) : test === "Hemoglobin" ? (
                            // ✅ HEMOGLOBIN (NUMERIC)
                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                              <Label>Result (g/dL):</Label>
                              <Input
                                type="number"
                                placeholder="Enter hemoglobin level"
                                value={labResults[test] || ""}
                                onChange={(e) =>
                                  handleInputChange(test, e.target.value)
                                }
                                className="w-60"
                              />
                            </div>
                          ) : (
                            // ✅ ALL OTHER IN-HOUSE TESTS (Positive/Negative Option)
                            <div className="flex gap-2 items-center">
                              <Label>Result:</Label>
                              <select
                                className="border rounded-md p-1"
                                value={labResults[test] || ""}
                                onChange={(e) =>
                                  handleInputChange(test, e.target.value)
                                }
                              >
                                <option value="">Select</option>
                                <option value="Positive">Positive</option>
                                <option value="Negative">Negative</option>
                              </select>
                            </div>
                          )
                        ) : (
                          // ✅ OUTSOURCE TESTS
                          <Badge variant="outline" className="w-fit">
                            Outsourced Test
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No lab tests assigned.</p>
            )}
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Label className="font-semibold">Lab Reported Date & Time:</Label>
            <Input
              type="datetime-local"
              value={
                labReportedDate
                  ? format(labReportedDate, "yyyy-MM-dd'T'HH:mm")
                  : ""
              }
              onChange={(e) => setLabReportedDate(new Date(e.target.value))}
              className="w-[250px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="font-semibold">Lab Collection Date & Time:</Label>
            <Input
              type="datetime-local"
              value={
                labCollectionDate
                  ? format(labCollectionDate, "yyyy-MM-dd'T'HH:mm")
                  : ""
              }
              onChange={(e) => setLabCollectionDate(new Date(e.target.value))}
              className="w-[250px]"
            />
          </div>

          <div className="flex justify-between items-center text-sm flex-wrap gap-3">
            <p>
              <span className="font-semibold">Lab Collection:</span>{" "}
              <Badge
                variant={
                  appointment.labCollection === "Pending"
                    ? "secondary"
                    : "default"
                }
              >
                {appointment.labCollection}
              </Badge>
            </p>

            <div className="flex items-center gap-3">
              {/* ✅ Always show this */}
              <Button onClick={handleGenerateLabReport}>
                Generate PDF Report
              </Button>

              {/* ✅ Only show this when labCollection is NOT Pending */}
              {appointment.labCollection !== "Pending" && (
                <Button
                  variant="outline"
                  onClick={() => handleViewLab(appointment.mrn)}
                >
                  View Lab Report
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Please wait...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
